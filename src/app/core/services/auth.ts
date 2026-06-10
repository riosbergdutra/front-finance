import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse } from '../models';

/**
 * Autenticação BFF stateless:
 * - access_token → memória (signal) — nunca localStorage
 * - SESSION_ID   → cookie HttpOnly gerenciado pelo backend
 *
 * F5 / Reload:
 * O token em memória é perdido. O authGuard chama refresh() automaticamente.
 * Se o cookie SESSION_ID ainda for válido, o backend devolve um novo access_token
 * e o usuário permanece logado sem precisar fazer login novamente.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api    = environment.apiUrl;

  private _accessToken = signal<string | null>(null);

  readonly accessToken    = computed(() => this._accessToken());
  readonly isAuthenticated = computed(() => this._accessToken() !== null);

  private refreshing$ = new BehaviorSubject<boolean>(false);

  get isRefreshing$() {
    return this.refreshing$.asObservable();
  }

  /** Valor atual do BehaviorSubject — usado pelo interceptor (não o Observable) */
  getIsRefreshing(): boolean {
    return this.refreshing$.getValue();
  }

  login(): void {
    window.location.href = `${this.api}/auth/login`;
  }

  handleCallback(code: string): Observable<AuthResponse> {
    const body = new URLSearchParams({ code });
    return this.http
      .post<AuthResponse>(`${this.api}/auth/callback`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true,
      })
      .pipe(
        tap((res) => this._accessToken.set(res.access_token)),
        catchError((err) => {
          this._accessToken.set(null);
          return throwError(() => err);
        })
      );
  }

  refresh(): Observable<AuthResponse> {
    this.refreshing$.next(true);
    return this.http
      .post<AuthResponse>(`${this.api}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => {
          this._accessToken.set(res.access_token);
          this.refreshing$.next(false);
        }),
        catchError((err) => {
          this._accessToken.set(null);
          this.refreshing$.next(false);
          this.router.navigate(['/login']);
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    this._accessToken.set(null);
    this.http
      .post(`${this.api}/auth/logout`, {}, { withCredentials: true })
      .subscribe({
        complete: () => this.router.navigate(['/login']),
        error:    () => this.router.navigate(['/login']),
      });
  }

  setToken(token: string): void  { this._accessToken.set(token); }
  getToken():          string | null { return this._accessToken(); }
}
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  access_token: string;
  sessionId?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;
  private _token = signal<string | null>(null);

  readonly accessToken = computed(() => this._token());
  readonly isAuthenticated = computed(() => this._token() !== null);

  private _refreshing$ = new BehaviorSubject(false);
  get isRefreshing$() { return this._refreshing$.asObservable(); }
  getIsRefreshing(): boolean { return this._refreshing$.getValue(); }

  constructor(private http: HttpClient, private router: Router) {}

  login(): void { window.location.href = `${this.api}/auth/login`; }

  handleCallback(code: string): Observable<AuthResponse> {
    const body = new URLSearchParams({ code });
    return this.http
      .post<AuthResponse>(`${this.api}/auth/callback`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true,
      })
      .pipe(
        tap((res) => this._token.set(res.access_token)),
        catchError((err) => { this._token.set(null); return throwError(() => err); })
      );
  }

  refresh(): Observable<AuthResponse> {
    this._refreshing$.next(true);
    return this.http
      .post<AuthResponse>(`${this.api}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => { this._token.set(res.access_token); this._refreshing$.next(false); }),
        catchError((err) => {
          this._token.set(null); this._refreshing$.next(false);
          this.router.navigate(['/login']);
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    this._token.set(null);
    this.http.post(`${this.api}/auth/logout`, {}, { withCredentials: true }).subscribe({
      complete: () => this.router.navigate(['/']),
      error: () => this.router.navigate(['/']),
    });
  }

  setToken(t: string): void { this._token.set(t); }
  getToken(): string | null { return this._token(); }
}

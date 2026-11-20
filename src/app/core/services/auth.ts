import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

interface SessionResponse {
  authenticated: boolean;
}

/**
 * BFF authentication: the browser never receives OAuth access/refresh tokens.
 * Authentication is represented by the server-managed HttpOnly SESSION_ID cookie.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = environment.apiUrl;

  private readonly authenticated = signal(false);
  readonly isAuthenticated = computed(() => this.authenticated());

  login(): void {
    window.location.assign(`${this.api}/auth/login`);
  }

  checkSession(): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.api}/auth/session`, {
      withCredentials: true,
    }).pipe(
      tap((response) => this.authenticated.set(response.authenticated)),
      catchError((error) => {
        this.authenticated.set(false);
        return throwError(() => error);
      }),
    );
  }

  refresh(): Observable<void> {
    return this.http.post<void>(`${this.api}/auth/refresh`, {}, {
      withCredentials: true,
    }).pipe(
      tap(() => this.authenticated.set(true)),
      catchError((error) => {
        this.authenticated.set(false);
        return throwError(() => error);
      }),
    );
  }

  logout(): void {
    this.authenticated.set(false);
    this.http.post<void>(`${this.api}/auth/logout`, {}, {
      withCredentials: true,
    }).subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}

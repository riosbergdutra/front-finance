import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  filter,
  finalize,
  map,
  shareReplay,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl.replace(/\\/+$/, '');
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];

interface CsrfResponse {
  token: string;
}

let refreshInFlight: Observable<void> | null = null;

/**
 * Reads a CSRF token directly from the downstream handler. Calling next()
 * here avoids re-entering this interceptor for the CSRF and refresh requests.
 */
const getCsrfToken = (next: Parameters<HttpInterceptorFn>[1]): Observable<string> =>
  next(new HttpRequest<null>(
    'GET',
    `${API_URL}/auth/csrf`,
    { withCredentials: true },
  )).pipe(
    filter((event): event is HttpResponse<CsrfResponse> => event instanceof HttpResponse),
    take(1),
    map((response) => {
      const token = response.body?.token;
      if (!token) {
        throw new Error('Não foi possível obter o token de proteção CSRF.');
      }
      return token;
    }),
  );

/**
 * Shares one refresh request across concurrent 401 responses. OAuth tokens
 * remain exclusively on the backend; only the HttpOnly session cookie is sent.
 */
const refreshSession = (
  next: Parameters<HttpInterceptorFn>[1],
  router: Router,
): Observable<void> => {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = getCsrfToken(next).pipe(
    switchMap((token) => next(new HttpRequest<Record<string, never>>(
      'POST',
      `${API_URL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        setHeaders: { 'X-XSRF-TOKEN': token },
      },
    ))),
    filter((event) => event instanceof HttpResponse),
    take(1),
    map(() => undefined),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
    finalize(() => {
      refreshInFlight = null;
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  return refreshInFlight;
};

/**
 * Sends the HttpOnly session cookie, adds CSRF protection to unsafe requests,
 * and performs one shared BFF refresh after a protected API request returns
 * 401. The original request is retried at most once.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiRequest = req.url === API_URL || req.url.startsWith(`${API_URL}/`);
  if (!isApiRequest) {
    return next(req);
  }

  const credentialed = req.clone({ withCredentials: true });
  const isAuthEndpoint = req.url === `${API_URL}/auth`
    || req.url.startsWith(`${API_URL}/auth/`);

  const sendRequest = (): Observable<HttpEvent<unknown>> => {
    if (SAFE_METHODS.includes(req.method.toUpperCase())) {
      return next(credentialed);
    }

    return getCsrfToken(next).pipe(
      switchMap((token) => next(credentialed.clone({
        setHeaders: { 'X-XSRF-TOKEN': token },
      }))),
    );
  };

  if (isAuthEndpoint) {
    return sendRequest();
  }

  const router = inject(Router);

  return sendRequest().pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return refreshSession(next, router).pipe(
        switchMap(() => {
          if (SAFE_METHODS.includes(req.method.toUpperCase())) {
            return next(credentialed);
          }

          // Fetch a fresh CSRF token before replaying an unsafe request.
          return getCsrfToken(next).pipe(
            switchMap((token) => next(credentialed.clone({
              setHeaders: { 'X-XSRF-TOKEN': token },
            }))),
          );
        }),
      );
    }),
  );
};

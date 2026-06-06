import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, filter, take } from 'rxjs';
import { AuthService } from '../services/auth';

/**
 * CORREÇÕES:
 *
 * 1. BUG CRÍTICO: `if (auth.isRefreshing$)` era sempre true porque isRefreshing$
 *    é um Observable (objeto truthy), não um boolean.
 *    Corrigido: usando auth.getIsRefreshing() que expõe o valor atual do BehaviorSubject.
 *
 * 2. Quando já está em refresh, a lógica de espera agora funciona corretamente:
 *    aguarda o BehaviorSubject emitir false (refresh completo) e então reexecuta
 *    a request original com o novo token.
 *
 * PATCH NECESSÁRIO EM auth.ts:
 *   Adicione este método público ao AuthService:
 *
 *   getIsRefreshing(): boolean {
 *     return this.refreshing$.getValue();
 *   }
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth = inject(AuthService);

  const publicRoutes = ['/auth/login', '/auth/callback', '/auth/refresh'];
  if (publicRoutes.some((r) => req.url.includes(r))) {
    return next(req);
  }

  const token = auth.getToken();
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) return throwError(() => error);

      // FIX: verifica o valor atual do BehaviorSubject, não o Observable em si
      if (auth.getIsRefreshing()) {
        return auth.isRefreshing$.pipe(
          filter((refreshing) => !refreshing),
          take(1),
          switchMap(() => {
            const newToken = auth.getToken();
            return next(newToken ? addToken(req, newToken) : req);
          })
        );
      }

      return auth.refresh().pipe(
        switchMap((res) => next(addToken(req, res.access_token))),
        catchError((refreshError) => throwError(() => refreshError))
      );
    })
  );
};

function addToken(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
}
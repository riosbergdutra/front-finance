import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth';

/**
 * authGuard com refresh automático:
 *
 * 1. Token em memória presente → acesso liberado
 * 2. Token ausente (F5/reload) → tenta refresh com o SESSION_ID cookie
 *    - Refresh ok  → seta novo token → acesso liberado
 *    - Refresh fail → redireciona para /login
 */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  // Token perdido (F5): tenta recuperar sessão via cookie HttpOnly
  return auth.refresh().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  return router.createUrlTree(['/app/dashboard']);
};
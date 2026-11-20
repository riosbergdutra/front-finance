import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';

import { authGuard, guestGuard } from '../../../app/core/guards/auth-guard';
import { AuthService } from '../../../app/core/services/auth';

const runGuard = (guard: CanActivateFn) =>
  TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );

const resolveGuard = async (guard: CanActivateFn) => {
  const result = runGuard(guard);
  return isObservable(result) ? firstValueFrom(result) : result;
};

describe('authGuard (BFF session)', () => {
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { checkSession: vi.fn() },
        },
      ],
    });
    auth = TestBed.inject(AuthService);
  });

  it('permite acesso quando a sessão do servidor está autenticada', async () => {
    vi.mocked(auth.checkSession).mockReturnValue(of({ authenticated: true }));
    expect(await resolveGuard(authGuard)).toBe(true);
  });

  it('redireciona para /login quando a sessão não está autenticada', async () => {
    vi.mocked(auth.checkSession).mockReturnValue(of({ authenticated: false }));
    const result = await resolveGuard(authGuard);
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('redireciona para /login quando a consulta da sessão falha', async () => {
    vi.mocked(auth.checkSession).mockReturnValue(throwError(() => new Error('401')));
    const result = await resolveGuard(authGuard);
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });
});

describe('guestGuard (BFF session)', () => {
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { checkSession: vi.fn() },
        },
      ],
    });
    auth = TestBed.inject(AuthService);
  });

  it('permite acesso de convidados quando não há sessão autenticada', async () => {
    vi.mocked(auth.checkSession).mockReturnValue(of({ authenticated: false }));
    expect(await resolveGuard(guestGuard)).toBe(true);
  });

  it('redireciona para o dashboard quando já existe sessão autenticada', async () => {
    vi.mocked(auth.checkSession).mockReturnValue(of({ authenticated: true }));
    const result = await resolveGuard(guestGuard);
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/app/dashboard');
  });

  it('permite acesso de convidados quando a consulta da sessão falha', async () => {
    vi.mocked(auth.checkSession).mockReturnValue(throwError(() => new Error('401')));
    expect(await resolveGuard(guestGuard)).toBe(true);
  });
});

import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
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

describe('authGuard', () => {
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: vi.fn(),
            refresh: vi.fn(),
          },
        },
      ],
    });

    auth = TestBed.inject(AuthService);
  });

  it('permite acesso quando já autenticado', async () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(true);

    const result = await resolveGuard(authGuard);

    expect(result).toBe(true);
  });

  it('tenta refresh quando não autenticado e permite após sucesso', async () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(false);
    vi.mocked(auth.refresh).mockReturnValue(of({ access_token: 'new' }));

    const result = await resolveGuard(authGuard);

    expect(auth.refresh).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('redireciona para /login quando refresh falha (F5 com sessão expirada)', async () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(false);
    vi.mocked(auth.refresh).mockReturnValue(throwError(() => new Error('401')));

    const result = await resolveGuard(authGuard);

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });
});

describe('guestGuard', () => {
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: vi.fn() },
        },
      ],
    });
    auth = TestBed.inject(AuthService);
  });

  it('permite acesso quando não autenticado', async () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(false);

    const result = await resolveGuard(guestGuard);

    expect(result).toBe(true);
  });

  it('redireciona para /dashboard quando já autenticado', async () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(true);

    const result = await resolveGuard(guestGuard);

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});

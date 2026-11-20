import 'zone.js/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { authGuard, guestGuard } from '../../../app/core/guards/auth-guard';
import { AuthService } from '../../../app/core/services/auth';

const runGuard = (guard: CanActivateFn) =>
  TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );

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

  it('permite acesso quando já autenticado', fakeAsync(() => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(true);

    let result: unknown;
    Promise.resolve(runGuard(authGuard)).then((r) => (result = r));
    tick();

    expect(result).toBe(true);
  }));

  it('tenta refresh quando não autenticado e permite após sucesso', fakeAsync(() => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(false);
    vi.mocked(auth.refresh).mockReturnValue(of({ access_token: 'new' }));

    let result: unknown;
    Promise.resolve(runGuard(authGuard)).then((r) => (result = r));
    tick();

    expect(auth.refresh).toHaveBeenCalled();
    expect(result).toBe(true);
  }));

  it('redireciona para /login quando refresh falha (F5 com sessão expirada)', fakeAsync(() => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(false);
    vi.mocked(auth.refresh).mockReturnValue(throwError(() => new Error('401')));

    let result: unknown;
    Promise.resolve(runGuard(authGuard)).then((r) => (result = r));
    tick();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  }));
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

  it('permite acesso quando não autenticado', fakeAsync(() => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(false);

    let result: unknown;
    Promise.resolve(runGuard(guestGuard)).then((r) => (result = r));
    tick();

    expect(result).toBe(true);
  }));

  it('redireciona para /dashboard quando já autenticado', fakeAsync(() => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(true);

    let result: unknown;
    Promise.resolve(runGuard(guestGuard)).then((r) => (result = r));
    tick();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  }));
});

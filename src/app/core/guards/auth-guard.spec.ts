import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { authGuard, guestGuard } from '../../../app/core/guards/auth-guard';
import { AuthService } from '../../../app/core/services/auth';

const runGuard = (guard: CanActivateFn) =>
  TestBed.runInInjectionContext(() =>
    guard({} as any, {} as any)
  );

describe('authGuard', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: jasmine.createSpy(),
            refresh: jasmine.createSpy(),
          },
        },
      ],
    });

    auth   = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('permite acesso quando já autenticado', fakeAsync(() => {
    (auth.isAuthenticated as jasmine.Spy).and.returnValue(true);

    let result: unknown;
    Promise.resolve(runGuard(authGuard)).then((r) => (result = r));
    tick();

    expect(result).toBeTrue();
  }));

  it('tenta refresh quando não autenticado e permite após sucesso', fakeAsync(() => {
    (auth.isAuthenticated as jasmine.Spy).and.returnValue(false);
    (auth.refresh as jasmine.Spy).and.returnValue(of({ access_token: 'new' }));

    let result: unknown;
    Promise.resolve(runGuard(authGuard)).then((r) => (result = r));
    tick();

    expect(auth.refresh).toHaveBeenCalled();
    expect(result).toBeTrue();
  }));

  it('redireciona para /login quando refresh falha (F5 com sessão expirada)', fakeAsync(() => {
    (auth.isAuthenticated as jasmine.Spy).and.returnValue(false);
    (auth.refresh as jasmine.Spy).and.returnValue(throwError(() => new Error('401')));

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
          useValue: { isAuthenticated: jasmine.createSpy() },
        },
      ],
    });
    auth = TestBed.inject(AuthService);
  });

  it('permite acesso quando não autenticado', fakeAsync(() => {
    (auth.isAuthenticated as jasmine.Spy).and.returnValue(false);

    let result: unknown;
    Promise.resolve(runGuard(guestGuard)).then((r) => (result = r));
    tick();

    expect(result).toBeTrue();
  }));

  it('redireciona para /dashboard quando já autenticado', fakeAsync(() => {
    (auth.isAuthenticated as jasmine.Spy).and.returnValue(true);

    let result: unknown;
    Promise.resolve(runGuard(guestGuard)).then((r) => (result = r));
    tick();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  }));
});
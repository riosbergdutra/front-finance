import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../app/core/services/auth';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: Router;

  const API = 'http://localhost:8080';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
      ],
    });

    service  = TestBed.inject(AuthService);
    http     = TestBed.inject(HttpTestingController);
    router   = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  // ── Estado inicial ──────────────────────────────────────────────────────

  it('inicia sem token e não autenticado', () => {
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('getIsRefreshing() retorna false inicialmente', () => {
    expect(service.getIsRefreshing()).toBeFalse();
  });

  // ── handleCallback ──────────────────────────────────────────────────────

  it('handleCallback armazena o token em memória', fakeAsync(() => {
    let done = false;

    service.handleCallback('code-123').subscribe(() => (done = true));

    const req = http.expectOne(`${API}/auth/callback`);
    expect(req.request.method).toBe('POST');
    req.flush({ access_token: 'token-abc' });
    tick();

    expect(done).toBeTrue();
    expect(service.getToken()).toBe('token-abc');
    expect(service.isAuthenticated()).toBeTrue();
  }));

  it('handleCallback limpa o token em caso de erro', fakeAsync(() => {
    service.handleCallback('bad-code').subscribe({ error: () => {} });

    http.expectOne(`${API}/auth/callback`).flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );
    tick();

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  }));

  // ── refresh ─────────────────────────────────────────────────────────────

  it('refresh define isRefreshing durante a chamada', fakeAsync(() => {
    service.refresh().subscribe();

    expect(service.getIsRefreshing()).toBeTrue();

    http.expectOne(`${API}/auth/refresh`).flush({ access_token: 'new-token' });
    tick();

    expect(service.getIsRefreshing()).toBeFalse();
    expect(service.getToken()).toBe('new-token');
  }));

  it('refresh em falha limpa o token e redireciona para /login', fakeAsync(() => {
    spyOn(router, 'navigate');

    service.refresh().subscribe({ error: () => {} });

    http.expectOne(`${API}/auth/refresh`).flush(
      {},
      { status: 401, statusText: 'Unauthorized' }
    );
    tick();

    expect(service.getToken()).toBeNull();
    expect(service.getIsRefreshing()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  // ── logout ──────────────────────────────────────────────────────────────

  it('logout limpa o token imediatamente e chama o backend', fakeAsync(() => {
    service.setToken('some-token');
    service.logout();

    expect(service.getToken()).toBeNull();

    http.expectOne(`${API}/auth/logout`).flush({});
    tick();
  }));

  // ── setToken / getToken ─────────────────────────────────────────────────

  it('setToken e getToken são simétricos', () => {
    service.setToken('test-token');
    expect(service.getToken()).toBe('test-token');
    expect(service.isAuthenticated()).toBeTrue();
  });
});
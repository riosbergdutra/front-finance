import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

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
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  // ── Estado inicial ──────────────────────────────────────────────────────

  it('inicia sem token e não autenticado', () => {
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('getIsRefreshing() retorna false inicialmente', () => {
    expect(service.getIsRefreshing()).toBe(false);
  });

  // ── handleCallback ──────────────────────────────────────────────────────

  it('handleCallback armazena o token em memória', () => {
    let done = false;

    service.handleCallback('code-123').subscribe(() => (done = true));

    const req = http.expectOne(`${API}/auth/callback`);
    expect(req.request.method).toBe('POST');
    req.flush({ access_token: 'token-abc' });

    expect(done).toBe(true);
    expect(service.getToken()).toBe('token-abc');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('handleCallback limpa o token em caso de erro', () => {
    service.handleCallback('bad-code').subscribe({ error: () => undefined });

    http.expectOne(`${API}/auth/callback`).flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  // ── refresh ─────────────────────────────────────────────────────────────

  it('refresh define isRefreshing durante a chamada', () => {
    service.refresh().subscribe();

    expect(service.getIsRefreshing()).toBe(true);

    http.expectOne(`${API}/auth/refresh`).flush({ access_token: 'new-token' });

    expect(service.getIsRefreshing()).toBe(false);
    expect(service.getToken()).toBe('new-token');
  });

  it('refresh em falha limpa o token e redireciona para /login', () => {
    service.refresh().subscribe({ error: () => undefined });

    http.expectOne(`${API}/auth/refresh`).flush(
      {},
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(service.getToken()).toBeNull();
    expect(service.getIsRefreshing()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  // ── logout ──────────────────────────────────────────────────────────────

  it('logout limpa o token imediatamente e chama o backend', () => {
    service.setToken('some-token');
    service.logout();

    expect(service.getToken()).toBeNull();

    http.expectOne(`${API}/auth/logout`).flush({});
  });

  // ── setToken / getToken ─────────────────────────────────────────────────

  it('setToken e getToken são simétricos', () => {
    service.setToken('test-token');
    expect(service.getToken()).toBe('test-token');
    expect(service.isAuthenticated()).toBe(true);
  });
});

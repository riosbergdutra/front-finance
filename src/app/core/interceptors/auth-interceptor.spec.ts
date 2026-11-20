import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { authInterceptor } from '../../../app/core/interceptors/auth-interceptor';
import { AuthService } from '../../../app/core/services/auth';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const API = 'http://localhost:8080';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth     = TestBed.inject(AuthService);
  });

  afterEach(() => httpMock.verify());

  // ── Rotas públicas ───────────────────────────────────────────────────────

  it('não adiciona token em rotas públicas (/auth/callback)', () => {
    http.post(`${API}/auth/callback`, {}).subscribe();

    const req = httpMock.expectOne(`${API}/auth/callback`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ access_token: 'x' });
  });

  it('não adiciona token em /auth/refresh', () => {
    http.post(`${API}/auth/refresh`, {}).subscribe();

    const req = httpMock.expectOne(`${API}/auth/refresh`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ access_token: 'x' });
  });

  // ── Requests autenticadas ────────────────────────────────────────────────

  it('adiciona Bearer token quando há token em memória', () => {
    auth.setToken('meu-token');
    http.get(`${API}/accounts`).subscribe();

    const req = httpMock.expectOne(`${API}/accounts`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer meu-token');
    req.flush([]);
  });

  it('envia withCredentials: true para transportar o cookie SESSION_ID', () => {
    auth.setToken('meu-token');
    http.get(`${API}/accounts`).subscribe();

    const req = httpMock.expectOne(`${API}/accounts`);
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('não adiciona Authorization quando não há token', () => {
    http.get(`${API}/accounts`).subscribe({ error: () => undefined });

    const req = httpMock.expectOne(`${API}/accounts`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    // Após 401 sem token, tenta refresh
    httpMock.expectOne(`${API}/auth/refresh`).flush(
      {}, { status: 401, statusText: 'Unauthorized' }
    );
  });

  // ── Refresh automático em 401 ────────────────────────────────────────────

  it('faz refresh e reexecuta a request em 401', () => {
    auth.setToken('token-expirado');
    let result: unknown;

    http.get(`${API}/transactions`).subscribe((r) => (result = r));

    // Primeira tentativa → 401
    const first = httpMock.expectOne(`${API}/transactions`);
    first.flush({}, { status: 401, statusText: 'Unauthorized' });

    // Interceptor faz refresh
    const refresh = httpMock.expectOne(`${API}/auth/refresh`);
    refresh.flush({ access_token: 'novo-token' });

    // Reexecuta com novo token
    const retry = httpMock.expectOne(`${API}/transactions`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer novo-token');
    retry.flush([{ id: '1' }]);

    expect(result).toEqual([{ id: '1' }]);
  });

  it('propaga o erro se o refresh também falhar', () => {
    auth.setToken('token-expirado');
    let errorCaptured = false;

    http.get(`${API}/transactions`).subscribe({ error: () => (errorCaptured = true) });

    httpMock.expectOne(`${API}/transactions`).flush(
      {}, { status: 401, statusText: 'Unauthorized' }
    );

    httpMock.expectOne(`${API}/auth/refresh`).flush(
      {}, { status: 401, statusText: 'Unauthorized' }
    );

    expect(errorCaptured).toBe(true);
  });
});
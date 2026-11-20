import { TestBed, fakeAsync, tick } from '@angular/core/testing';
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

  it('não adiciona token em rotas públicas (/auth/callback)', fakeAsync(() => {
    http.post(`${API}/auth/callback`, {}).subscribe();

    const req = httpMock.expectOne(`${API}/auth/callback`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ access_token: 'x' });
    tick();
  }));

  it('não adiciona token em /auth/refresh', fakeAsync(() => {
    http.post(`${API}/auth/refresh`, {}).subscribe();

    const req = httpMock.expectOne(`${API}/auth/refresh`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ access_token: 'x' });
    tick();
  }));

  // ── Requests autenticadas ────────────────────────────────────────────────

  it('adiciona Bearer token quando há token em memória', fakeAsync(() => {
    auth.setToken('meu-token');
    http.get(`${API}/accounts`).subscribe();

    const req = httpMock.expectOne(`${API}/accounts`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer meu-token');
    req.flush([]);
    tick();
  }));

  it('envia withCredentials: true para transportar o cookie SESSION_ID', fakeAsync(() => {
    auth.setToken('meu-token');
    http.get(`${API}/accounts`).subscribe();

    const req = httpMock.expectOne(`${API}/accounts`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush([]);
    tick();
  }));

  it('não adiciona Authorization quando não há token', fakeAsync(() => {
    http.get(`${API}/accounts`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${API}/accounts`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
    tick();

    // Após 401 sem token, tenta refresh
    httpMock.expectOne(`${API}/auth/refresh`).flush(
      {}, { status: 401, statusText: 'Unauthorized' }
    );
    tick();
  }));

  // ── Refresh automático em 401 ────────────────────────────────────────────

  it('faz refresh e reexecuta a request em 401', fakeAsync(() => {
    auth.setToken('token-expirado');
    let result: unknown;

    http.get(`${API}/transactions`).subscribe((r) => (result = r));

    // Primeira tentativa → 401
    const first = httpMock.expectOne(`${API}/transactions`);
    first.flush({}, { status: 401, statusText: 'Unauthorized' });
    tick();

    // Interceptor faz refresh
    const refresh = httpMock.expectOne(`${API}/auth/refresh`);
    refresh.flush({ access_token: 'novo-token' });
    tick();

    // Reexecuta com novo token
    const retry = httpMock.expectOne(`${API}/transactions`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer novo-token');
    retry.flush([{ id: '1' }]);
    tick();

    expect(result).toEqual([{ id: '1' }]);
  }));

  it('propaga o erro se o refresh também falhar', fakeAsync(() => {
    auth.setToken('token-expirado');
    let errorCaptured = false;

    http.get(`${API}/transactions`).subscribe({ error: () => (errorCaptured = true) });

    httpMock.expectOne(`${API}/transactions`).flush(
      {}, { status: 401, statusText: 'Unauthorized' }
    );
    tick();

    httpMock.expectOne(`${API}/auth/refresh`).flush(
      {}, { status: 401, statusText: 'Unauthorized' }
    );
    tick();

    expect(errorCaptured).toBeTrue();
  }));
});
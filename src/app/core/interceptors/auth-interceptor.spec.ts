import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpErrorResponse,
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { authInterceptor } from '../../../app/core/interceptors/auth-interceptor';

describe('authInterceptor (BFF session)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;

  const API = 'http://localhost:8080';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  it('envia cookies de sessão em requests GET sem expor Bearer token', () => {
    http.get(`${API}/accounts`).subscribe();
    const req = httpMock.expectOne(`${API}/accounts`);
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('obtém CSRF e envia o header em requests POST', () => {
    http.post(`${API}/transactions`, { amount: 10 }).subscribe();

    const csrf = httpMock.expectOne(`${API}/auth/csrf`);
    expect(csrf.request.method).toBe('GET');
    expect(csrf.request.withCredentials).toBe(true);
    csrf.flush({ token: 'csrf-test-token' });

    const request = httpMock.expectOne(`${API}/transactions`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-test-token');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ id: 'tx-1' });
  });

  it('renova a sessão após 401 e repete uma requisição GET uma única vez', () => {
    let result: unknown;
    http.get(`${API}/accounts`).subscribe((value) => result = value);

    httpMock.expectOne(`${API}/accounts`).flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );

    const refreshCsrf = httpMock.expectOne(`${API}/auth/csrf`);
    refreshCsrf.flush({ token: 'csrf-refresh-token' });

    const refresh = httpMock.expectOne(`${API}/auth/refresh`);
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-refresh-token');
    refresh.flush(null);

    const retry = httpMock.expectOne(`${API}/accounts`);
    expect(retry.request.method).toBe('GET');
    expect(retry.request.withCredentials).toBe(true);
    retry.flush([{ id: 'account-1' }]);

    expect(result).toEqual([{ id: 'account-1' }]);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('renova antes de repetir POST e obtém um novo token CSRF', () => {
    let result: unknown;
    http.post(`${API}/transactions`, { amount: 10 }).subscribe((value) => result = value);

    httpMock.expectOne(`${API}/auth/csrf`).flush({ token: 'csrf-before-token' });
    httpMock.expectOne(`${API}/transactions`).flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );

    httpMock.expectOne(`${API}/auth/csrf`).flush({ token: 'csrf-refresh-token' });
    const refresh = httpMock.expectOne(`${API}/auth/refresh`);
    expect(refresh.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-refresh-token');
    refresh.flush(null);

    httpMock.expectOne(`${API}/auth/csrf`).flush({ token: 'csrf-retry-token' });
    const retry = httpMock.expectOne(`${API}/transactions`);
    expect(retry.request.method).toBe('POST');
    expect(retry.request.withCredentials).toBe(true);
    expect(retry.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-retry-token');
    retry.flush({ id: 'tx-1' });

    expect(result).toEqual({ id: 'tx-1' });
  });

  it('compartilha um único refresh entre requests concorrentes', () => {
    const first: unknown[] = [];
    const second: unknown[] = [];
    http.get(`${API}/accounts`).subscribe((value) => first.push(value));
    http.get(`${API}/transactions`).subscribe((value) => second.push(value));

    httpMock.expectOne(`${API}/accounts`).flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );
    httpMock.expectOne(`${API}/transactions`).flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );

    httpMock.expectOne(`${API}/auth/csrf`).flush({ token: 'csrf-refresh-token' });
    httpMock.expectOne(`${API}/auth/refresh`).flush(null);

    httpMock.expectOne(`${API}/accounts`).flush([{ id: 'account-1' }]);
    httpMock.expectOne(`${API}/transactions`).flush([{ id: 'tx-1' }]);

    expect(first).toEqual([[{ id: 'account-1' }]]);
    expect(second).toEqual([[{ id: 'tx-1' }]]);
  });

  it('não tenta refresh quando o próprio endpoint de autenticação retorna 401', () => {
    let error: unknown;
    http.get(`${API}/auth/session`).subscribe({ error: (value) => error = value });

    httpMock.expectOne(`${API}/auth/session`).flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(error).toBeInstanceOf(HttpErrorResponse);
    httpMock.expectNone(`${API}/auth/refresh`);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redireciona ao login quando o refresh retorna 401', () => {
    let error: unknown;
    http.get(`${API}/accounts`).subscribe({ error: (value) => error = value });

    httpMock.expectOne(`${API}/accounts`).flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );
    httpMock.expectOne(`${API}/auth/csrf`).flush({ token: 'csrf-refresh-token' });
    httpMock.expectOne(`${API}/auth/refresh`).flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    httpMock.expectNone(`${API}/accounts`);
  });

  it('não envia cookies para hosts que apenas começam com a URL da API', () => {
    http.get('http://localhost:8080.attacker.example/resource').subscribe();
    const req = httpMock.expectOne('http://localhost:8080.attacker.example/resource');
    expect(req.request.withCredentials).toBe(false);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('não altera requests para origens fora da API', () => {
    http.get('https://example.com/resource').subscribe();
    const req = httpMock.expectOne('https://example.com/resource');
    expect(req.request.withCredentials).toBe(false);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});

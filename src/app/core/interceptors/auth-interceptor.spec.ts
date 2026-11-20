import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { authInterceptor } from '../../../app/core/interceptors/auth-interceptor';

describe('authInterceptor (BFF session)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  const API = 'http://localhost:8080';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
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

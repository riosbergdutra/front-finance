import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from './auth';

describe('AuthService (BFF session)', () => {
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

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  it('starts unauthenticated without storing OAuth tokens', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('checks the HttpOnly-backed session with credentials', () => {
    let authenticated = false;
    service.checkSession().subscribe((result) => authenticated = result.authenticated);

    const req = http.expectOne(`${API}/auth/session`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ authenticated: true });

    expect(authenticated).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears local authentication state when the session is invalid', () => {
    service.checkSession().subscribe({ error: () => undefined });

    http.expectOne(`${API}/auth/session`).flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(service.isAuthenticated()).toBe(false);
  });

  it('refreshes the server-side session without receiving an access token', () => {
    service.refresh().subscribe();

    const req = http.expectOne(`${API}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(null);

    expect(service.isAuthenticated()).toBe(true);
  });

  it('logout clears local state and calls the backend with credentials', () => {
    service.checkSession().subscribe();
    http.expectOne(`${API}/auth/session`).flush({ authenticated: true });

    service.logout();

    const req = http.expectOne(`${API}/auth/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    req.flush(null);
  });
});

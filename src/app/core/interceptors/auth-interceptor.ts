import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { filter, map, switchMap } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

const API_URL = environment.apiUrl;
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];

interface CsrfResponse {
  token: string;
}

/**
 * Sends the HttpOnly session cookie with API requests and adds the CSRF token
 * to unsafe requests. OAuth tokens are never read or attached by the browser.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) {
    return next(req);
  }

  const credentialed = req.clone({ withCredentials: true });
  if (SAFE_METHODS.includes(req.method.toUpperCase())) {
    return next(credentialed);
  }

  // Fetch a fresh CSRF token through the remainder of the interceptor chain.
  const csrfRequest = new HttpRequest<CsrfResponse>(
    'GET',
    `${API_URL}/auth/csrf`,
    { withCredentials: true },
  );

  return next(csrfRequest).pipe(
    filter((event): event is HttpResponse<CsrfResponse> => event instanceof HttpResponse),
    map((response) => response.body?.token),
    switchMap((token) => {
      if (!token) {
        throw new Error('Não foi possível obter o token de proteção CSRF.');
      }
      return next(credentialed.clone({
        setHeaders: { 'X-XSRF-TOKEN': token },
      }));
    }),
  );
};

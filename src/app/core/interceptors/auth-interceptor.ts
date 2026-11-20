import {
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { environment } from '../../environments/environment';
import { filter, map, switchMap } from 'rxjs';

const API_URL = environment.apiUrl.replace(/\/+$/, '');
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];

interface CsrfResponse {
  token: string;
}

/**
 * Sends the HttpOnly session cookie with API requests and adds the CSRF token
 * to unsafe requests. OAuth tokens are never read or attached by the browser.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Match the API base URL as a complete path prefix, not an arbitrary string
  // prefix (which could also match an attacker-controlled hostname).
  const isApiRequest = req.url === API_URL || req.url.startsWith(`${API_URL}/`);
  if (!isApiRequest) {
    return next(req);
  }

  const credentialed = req.clone({ withCredentials: true });
  if (SAFE_METHODS.includes(req.method.toUpperCase())) {
    return next(credentialed);
  }

  const csrfRequest = new HttpRequest<null>(
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

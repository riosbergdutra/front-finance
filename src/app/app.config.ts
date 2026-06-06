import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';

/**
 * CORREÇÕES:
 *
 * 1. provideHttpClient() estava ausente — nenhuma requisição HTTP funcionava.
 *    withInterceptors([authInterceptor]) registra o interceptor funcional (Angular 19+).
 *    withFetch() usa a Fetch API nativa em vez de XMLHttpRequest (melhor performance).
 *
 * 2. provideAnimationsAsync() estava ausente — Angular Material não funcionava
 *    (campos, snackbars, dialogs sem animação/renderização correta).
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    provideAnimationsAsync(),
  ],
};
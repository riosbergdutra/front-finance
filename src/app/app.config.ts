import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePtBr from '@angular/common/locales/pt';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';

// CurrencyPipe/DatePipe require locale data to be registered explicitly.
registerLocaleData(localePtBr, 'pt-BR');

/**
 * CORREÇÕES:
 *
 * 1. provideHttpClient() estava ausente — nenhuma requisição HTTP funcionava.
 *    withInterceptors([authInterceptor]) registra o interceptor funcional (Angular 19+).
 *    withFetch() usa a Fetch API nativa em vez de XMLHttpRequest (melhor performance).
 *
 * 2. provideAnimationsAsync() estava ausente — Angular Material não funcionava
 *    (campos, snackbars, dialogs sem animação/renderização correta).
 *
 * 3. Registra os dados de localização pt-BR e define o locale padrão da aplicação,
 *    evitando NG0701 nos pipes de moeda, data e número.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    provideAnimationsAsync(),
  ],
};

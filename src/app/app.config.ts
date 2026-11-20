import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';

// Registra os dados de formatação pt-BR no Angular
registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      // Removido withFetch() para impedir que requisições rodem fora da Zone
      withInterceptors([authInterceptor])
    ),
    provideAnimationsAsync(),
    // Define o idioma padrão da aplicação para Português (Brasil)
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
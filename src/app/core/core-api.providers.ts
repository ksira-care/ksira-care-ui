import { Provider } from '@angular/core';
import { AuthGateway } from './auth/auth.gateway';
import { HttpAuthGateway } from './auth/http-auth.gateway';
import { HttpLanguagesGateway } from './languages/http-languages.gateway';
import { LanguagesGateway } from './languages/languages.gateway';

/**
 * How the app talks to the API parts both portals share: sign-in and languages.
 *
 * Production builds use these real gateways. Development builds swap this file
 * for `core-api.providers.mock.ts` (see `fileReplacements` in angular.json), so
 * mock data and demo accounts never ship to production.
 */
export function provideCoreApi(): Provider[] {
  return [
    { provide: AuthGateway, useClass: HttpAuthGateway },
    { provide: LanguagesGateway, useClass: HttpLanguagesGateway },
  ];
}

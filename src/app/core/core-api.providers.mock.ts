import { Provider } from '@angular/core';
import { AuthGateway } from './auth/auth.gateway';
import { MockAuthGateway } from './auth/mock-auth.gateway';
import { LanguagesGateway } from './languages/languages.gateway';
import { MockLanguagesGateway } from './languages/mock-languages.gateway';

/** Development stand-in for `core-api.providers.ts`: in-memory mocks and demo accounts. */
export function provideCoreApi(): Provider[] {
  return [
    { provide: AuthGateway, useClass: MockAuthGateway },
    { provide: LanguagesGateway, useClass: MockLanguagesGateway },
  ];
}

import { Provider } from '@angular/core';
import { HttpLanguagesGateway } from '../../core/languages/http-languages.gateway';
import { LanguagesGateway } from '../../core/languages/languages.gateway';
import { BookingGateway } from './booking.gateway';
import { HttpBookingGateway } from './http-booking.gateway';

/**
 * How the website's booking form talks to the backend. Development builds swap
 * this file for `booking-api.providers.mock.ts` (see angular.json).
 */
export function provideBookingApi(): Provider[] {
  return [
    { provide: BookingGateway, useClass: HttpBookingGateway },
    { provide: LanguagesGateway, useClass: HttpLanguagesGateway },
  ];
}

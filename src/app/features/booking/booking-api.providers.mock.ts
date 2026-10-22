import { Provider } from '@angular/core';
import { LanguagesGateway } from '../../core/languages/languages.gateway';
import { MockLanguagesGateway } from '../../core/languages/mock-languages.gateway';
import { BookingGateway } from './booking.gateway';
import { MockBookingGateway } from './mock-booking.gateway';

/** Development stand-in for `booking-api.providers.ts`. */
export function provideBookingApi(): Provider[] {
  return [
    { provide: BookingGateway, useClass: MockBookingGateway },
    { provide: LanguagesGateway, useClass: MockLanguagesGateway },
  ];
}

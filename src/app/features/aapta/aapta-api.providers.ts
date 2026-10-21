import { Provider } from '@angular/core';
import { AvailabilityGateway } from './availability/availability.gateway';
import { HttpAvailabilityGateway } from './availability/http-availability.gateway';
import { BookingsGateway } from './bookings/bookings.gateway';
import { HttpBookingsGateway } from './bookings/http-bookings.gateway';
import { DashboardGateway } from './dashboard/dashboard.gateway';
import { HttpDashboardGateway } from './dashboard/http-dashboard.gateway';
import { HttpProfileGateway } from './profile/http-profile.gateway';
import { ProfileGateway } from './profile/profile.gateway';

/**
 * The one place that decides how the aapta portal talks to the backend.
 *
 * Production builds use these real API gateways. Development builds swap
 * this file for `aapta-api.providers.mock.ts` (see `fileReplacements` in
 * angular.json), so mock data never ships to production.
 */
export function provideAaptaApi(): Provider[] {
  return [
    { provide: DashboardGateway, useClass: HttpDashboardGateway },
    { provide: BookingsGateway, useClass: HttpBookingsGateway },
    { provide: AvailabilityGateway, useClass: HttpAvailabilityGateway },
    { provide: ProfileGateway, useClass: HttpProfileGateway },
  ];
}

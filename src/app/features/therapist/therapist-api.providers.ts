import { Provider } from '@angular/core';
import { AuthGateway } from '../../core/auth/auth.gateway';
import { HttpAuthGateway } from '../../core/auth/http-auth.gateway';
import { AvailabilityGateway } from './availability/availability.gateway';
import { HttpAvailabilityGateway } from './availability/http-availability.gateway';
import { BookingsGateway } from './bookings/bookings.gateway';
import { HttpBookingsGateway } from './bookings/http-bookings.gateway';
import { DashboardGateway } from './dashboard/dashboard.gateway';
import { HttpDashboardGateway } from './dashboard/http-dashboard.gateway';
import { HttpProfileGateway } from './profile/http-profile.gateway';
import { ProfileGateway } from './profile/profile.gateway';

/**
 * The one place that decides how the portal talks to the backend.
 *
 * Production builds use these real API gateways. Development builds swap
 * this file for `therapist-api.providers.mock.ts` (see `fileReplacements` in
 * angular.json), so mock data and demo accounts never ship to production.
 */
export function provideTherapistApi(): Provider[] {
  return [
    { provide: AuthGateway, useClass: HttpAuthGateway },
    { provide: DashboardGateway, useClass: HttpDashboardGateway },
    { provide: BookingsGateway, useClass: HttpBookingsGateway },
    { provide: AvailabilityGateway, useClass: HttpAvailabilityGateway },
    { provide: ProfileGateway, useClass: HttpProfileGateway },
  ];
}

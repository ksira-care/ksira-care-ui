import { Provider } from '@angular/core';
import { AuthGateway } from '../../core/auth/auth.gateway';
import { MockAuthGateway } from '../../core/auth/mock-auth.gateway';
import { AvailabilityGateway } from './availability/availability.gateway';
import { MockAvailabilityGateway } from './availability/mock-availability.gateway';
import { BookingsGateway } from './bookings/bookings.gateway';
import { MockBookingsGateway } from './bookings/mock-bookings.gateway';
import { DashboardGateway } from './dashboard/dashboard.gateway';
import { MockDashboardGateway } from './dashboard/mock-dashboard.gateway';
import { MockProfileGateway } from './profile/mock-profile.gateway';
import { ProfileGateway } from './profile/profile.gateway';

/**
 * Development stand-in for `therapist-api.providers.ts`: in-memory mocks with
 * demo data, swapped in by angular.json for `ng serve`. Provided once for the
 * whole portal, so mock state (marks, saved hours) survives moving between pages.
 */
export function provideTherapistApi(): Provider[] {
  return [
    { provide: AuthGateway, useClass: MockAuthGateway },
    { provide: DashboardGateway, useClass: MockDashboardGateway },
    { provide: BookingsGateway, useClass: MockBookingsGateway },
    { provide: AvailabilityGateway, useClass: MockAvailabilityGateway },
    { provide: ProfileGateway, useClass: MockProfileGateway },
  ];
}

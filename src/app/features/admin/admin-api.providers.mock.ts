import { Provider } from '@angular/core';
import { AaptasGateway } from './aaptas/aaptas.gateway';
import { AvailabilityOverviewGateway } from './availability/availability-overview.gateway';
import { HistoryGateway } from './history/history.gateway';
import { MockAaptasGateway } from './mock/mock-aaptas.gateway';
import { MockAdminWorld } from './mock/mock-admin-world';
import { MockAvailabilityOverviewGateway } from './mock/mock-availability-overview.gateway';
import { MockHistoryGateway } from './mock/mock-history.gateway';
import { MockTodayGateway } from './mock/mock-today.gateway';
import { TodayGateway } from './today/today.gateway';

/**
 * Development stand-in for `admin-api.providers.ts`: every page works on one
 * in-memory world, so a change on one page shows on the others.
 */
export function provideAdminApi(): Provider[] {
  return [
    MockAdminWorld,
    { provide: TodayGateway, useClass: MockTodayGateway },
    { provide: AvailabilityOverviewGateway, useClass: MockAvailabilityOverviewGateway },
    { provide: AaptasGateway, useClass: MockAaptasGateway },
    { provide: HistoryGateway, useClass: MockHistoryGateway },
  ];
}

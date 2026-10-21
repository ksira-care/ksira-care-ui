import { Provider } from '@angular/core';
import { AaptasGateway } from './aaptas/aaptas.gateway';
import { HttpAaptasGateway } from './aaptas/http-aaptas.gateway';
import { AvailabilityOverviewGateway } from './availability/availability-overview.gateway';
import { HttpAvailabilityOverviewGateway } from './availability/http-availability-overview.gateway';
import { HistoryGateway } from './history/history.gateway';
import { HttpHistoryGateway } from './history/http-history.gateway';
import { HttpTodayGateway } from './today/http-today.gateway';
import { TodayGateway } from './today/today.gateway';

/**
 * The one place that decides how the admin console talks to the backend.
 * Development builds swap this file for `admin-api.providers.mock.ts` (see
 * `fileReplacements` in angular.json), so mock data never ships to production.
 */
export function provideAdminApi(): Provider[] {
  return [
    { provide: TodayGateway, useClass: HttpTodayGateway },
    { provide: AvailabilityOverviewGateway, useClass: HttpAvailabilityOverviewGateway },
    { provide: AaptasGateway, useClass: HttpAaptasGateway },
    { provide: HistoryGateway, useClass: HttpHistoryGateway },
  ];
}

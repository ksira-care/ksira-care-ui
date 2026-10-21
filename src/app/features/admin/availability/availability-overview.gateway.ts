import { Observable } from 'rxjs';
import { CivilDate } from '../../../core/time/civil-date';
import { AvailabilityOverview } from './availability-overview.models';

/** Boundary between the availability grid and the API. View only. Errors are `ApiError`s. */
export abstract class AvailabilityOverviewGateway {
  abstract getDay(date: CivilDate): Observable<AvailabilityOverview>;
}

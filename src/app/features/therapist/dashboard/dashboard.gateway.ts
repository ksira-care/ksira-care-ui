import { Observable } from 'rxjs';
import { DashboardSummary } from './dashboard.models';

/** Boundary between the dashboard and the API that serves its data. */
export abstract class DashboardGateway {
  /** Summary for the signed-in therapist (identified by the session cookie). */
  abstract getSummary(): Observable<DashboardSummary>;
}

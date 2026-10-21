import { Observable } from 'rxjs';
import { HistoryExport, HistoryMonth, MonthKey } from './history.models';

/** Boundary between the History page and the API. Errors are `ApiError`s. */
export abstract class HistoryGateway {
  /** One month; the current one if none is given. */
  abstract getMonth(month?: MonthKey): Observable<HistoryMonth>;

  /** Always last month. Afterwards, older months that were already exported are deleted. */
  abstract exportLastMonth(): Observable<HistoryExport>;
}

import { Observable } from 'rxjs';
import { DateRange } from '../portal-time';
import { Slot, SlotChange } from './availability.models';

/** Boundary between the availability page and the slots API. */
export abstract class AvailabilityGateway {
  /** The signed-in therapist's hours within `range`. Hours with no record are closed. */
  abstract getSlots(range: DateRange): Observable<Slot[]>;

  /**
   * Applies only the hours the therapist changed. Errors with
   * `AvailabilityError('conflict')` if one of them was booked meanwhile.
   */
  abstract saveChanges(changes: readonly SlotChange[]): Observable<void>;
}

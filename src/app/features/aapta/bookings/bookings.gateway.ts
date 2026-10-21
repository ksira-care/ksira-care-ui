import { Observable } from 'rxjs';
import { DateRange } from '../../../core/time/portal-time';
import { Booking, AaptaSetStatus } from './booking.models';

/** Boundary between the portal and the bookings API. */
export abstract class BookingsGateway {
  /** The signed-in aapta's bookings that start within `range`. */
  abstract getBookings(range: DateRange): Observable<Booking[]>;

  /** Marks a session complete or as a client no-show, or reverts it to scheduled (undo). */
  abstract updateStatus(bookingId: string, status: AaptaSetStatus): Observable<void>;
}

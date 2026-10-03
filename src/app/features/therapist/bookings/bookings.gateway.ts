import { Observable } from 'rxjs';
import { DateRange } from '../portal-time';
import { Booking, TherapistSetStatus } from './booking.models';

/** Boundary between the portal and the bookings API. */
export abstract class BookingsGateway {
  /** The signed-in therapist's bookings that start within `range`. */
  abstract getBookings(range: DateRange): Observable<Booking[]>;

  /** Marks a session complete or as a client no-show, or reverts it to scheduled (undo). */
  abstract updateStatus(bookingId: string, status: TherapistSetStatus): Observable<void>;
}

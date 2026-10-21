import { Observable } from 'rxjs';
import { CivilDate } from '../../../core/time/civil-date';
import { AaptaRef } from '../admin.models';
import { AdminBooking, AllocationChange, BookingForm } from './today.models';

/** Boundary between the Today page and the admin bookings API. Errors are `ApiError`s. */
export abstract class TodayGateway {
  /** Every booking starting that day (IST), cancelled ones included. */
  abstract getDay(date: CivilDate): Observable<AdminBooking[]>;

  abstract getForm(bookingId: string): Observable<BookingForm>;

  /** The current aapta first, then those free that hour who speak one of the client's languages. */
  abstract getAaptaOptions(bookingId: string): Observable<AaptaRef[]>;

  /** "Add" and "Update": answers with the row as saved. */
  abstract allocate(bookingId: string, change: AllocationChange): Observable<AdminBooking>;

  abstract cancel(bookingId: string, reason: string, version: number): Observable<AdminBooking>;
}

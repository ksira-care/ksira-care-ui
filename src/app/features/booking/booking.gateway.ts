import { Observable } from 'rxjs';
import { BookableHour, BookingConfirmation, BookingRequest } from './booking.models';

/** Boundary between the booking form and the public booking API. Errors are `ApiError`s. */
export abstract class BookingGateway {
  /** Hours from now until `until` that someone speaking any of `languages` can book, in order. */
  abstract getBookableHours(languages: readonly string[], until: Date): Observable<BookableHour[]>;

  /** TIME_NOT_AVAILABLE if the hour was just taken; RATE_LIMITED after too many bookings. */
  abstract book(request: BookingRequest): Observable<BookingConfirmation>;
}

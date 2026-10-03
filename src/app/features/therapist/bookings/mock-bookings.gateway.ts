import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { DateRange } from '../portal-time';
import { Booking, TherapistSetStatus } from './booking.models';
import { BookingsGateway } from './bookings.gateway';
import { mockBookings } from './mock-bookings.data';

const LATENCY_MS = 600;

/**
 * Stand-in for the bookings API until it is deployed. Covers last month to
 * next month, and remembers status changes for the rest of the session.
 */
@Injectable()
export class MockBookingsGateway extends BookingsGateway {
  private readonly marks = new Map<string, Pick<Booking, 'status' | 'markedAt'>>();

  override getBookings(range: DateRange): Observable<Booking[]> {
    return timer(LATENCY_MS).pipe(
      map(() =>
        mockBookings(new Date())
          .filter((b) => b.start >= range.start && b.start < range.end)
          .map((b) => ({ ...b, ...this.marks.get(b.id) })),
      ),
    );
  }

  override updateStatus(bookingId: string, status: TherapistSetStatus): Observable<void> {
    return timer(LATENCY_MS / 2).pipe(
      map(() => {
        this.marks.set(bookingId, { status, markedAt: status === 'scheduled' ? null : new Date() });
      }),
    );
  }
}

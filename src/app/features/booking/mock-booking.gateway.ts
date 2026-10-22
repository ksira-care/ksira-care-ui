import { Injectable } from '@angular/core';
import { Observable, defer, switchMap, timer } from 'rxjs';
import { ApiError } from '../../core/http/api-error';
import { HOUR_MS } from '../../core/time/portal-time';
import { BookingGateway } from './booking.gateway';
import { BookableHour, BookingConfirmation, BookingRequest, LEAD_TIME_HOURS } from './booking.models';

const LATENCY_MS = 500;
const FIRST_HOUR_IST = 9;
const LAST_HOUR_IST = 23;
const HALF_HOUR_MS = HOUR_MS / 2;
const IST_OFFSET_MS = 5.5 * HOUR_MS;

/**
 * Stand-in for the public booking API in development: most hours between
 * 09:00 and 23:00 IST are open (fewer for Kannada), and an hour, once booked,
 * is gone.
 */
@Injectable()
export class MockBookingGateway extends BookingGateway {
  private readonly booked = new Set<number>();

  override getBookableHours(languages: readonly string[], until: Date): Observable<BookableHour[]> {
    return this.respond(() => {
      const hours: BookableHour[] = [];
      const earliest = Date.now() + LEAD_TIME_HOURS * HOUR_MS;
      // IST is UTC+5:30, so IST hours begin at :30 past the UTC hour.
      const first = Math.ceil((earliest - HALF_HOUR_MS) / HOUR_MS) * HOUR_MS + HALF_HOUR_MS;
      const kannadaOnly = languages.length === 1 && languages[0] === 'kn';
      for (let t = first; t < until.getTime(); t += HOUR_MS) {
        const istHour = new Date(t + IST_OFFSET_MS).getUTCHours();
        const inDay = istHour >= FIRST_HOUR_IST && istHour <= LAST_HOUR_IST;
        const someoneFree = (istHour + new Date(t).getUTCDate()) % 4 !== 0 && (!kannadaOnly || istHour % 3 === 0);
        if (inDay && someoneFree && !this.booked.has(t)) hours.push({ start: new Date(t), end: new Date(t + HOUR_MS) });
      }
      return hours;
    });
  }

  override book(request: BookingRequest): Observable<BookingConfirmation> {
    return this.respond(() => {
      const t = request.start.getTime();
      if (this.booked.has(t)) throw new ApiError('TIME_NOT_AVAILABLE');
      this.booked.add(t);
      return { id: `bk_${t}`, start: request.start, end: new Date(t + HOUR_MS) };
    });
  }

  private respond<T>(work: () => T): Observable<T> {
    return timer(LATENCY_MS).pipe(switchMap(() => defer(async () => work())));
  }
}

import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { addDays, portalToday, startOf } from '../../../core/time/civil-date';
import { portalDayRange, portalMonthRange } from '../../../core/time/portal-time';
import { Booking } from '../bookings/booking.models';
import { LOOKBACK_DAYS } from '../bookings/bookings.store';
import { mockBookings } from '../bookings/mock-bookings.data';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardSummary } from './dashboard.models';

const LATENCY_MS = 500;

/** Stand-in for the dashboard API, computed from the same mock bookings as the rest of the portal. */
@Injectable()
export class MockDashboardGateway extends DashboardGateway {
  override getSummary(): Observable<DashboardSummary> {
    return timer(LATENCY_MS).pipe(
      map(() => {
        const now = new Date();
        const completed = mockBookings(now).filter((b) => b.status === 'completed');
        const month = portalMonthRange(now);
        const recent = { start: startOf(addDays(portalToday(now), -LOOKBACK_DAYS)), end: portalDayRange(now).end };
        const countIn = (range: { start: Date; end: Date }) =>
          completed.filter((b: Booking) => b.start >= range.start && b.start < range.end).length;

        return { completedThisMonth: countIn(month), completedLast30Days: countIn(recent) };
      }),
    );
  }
}

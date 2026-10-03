import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { mockBookings } from '../bookings/mock-bookings.data';
import { parsePortalDate, portalMonthRange } from '../portal-time';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardSummary } from './dashboard.models';

const LATENCY_MS = 500;
/** Sessions completed before the current month, for the all-time total. */
const COMPLETED_IN_EARLIER_MONTHS = 114;

/** Stand-in for the dashboard API, computed from the same mock bookings as the rest of the portal. */
@Injectable()
export class MockDashboardGateway extends DashboardGateway {
  override getSummary(): Observable<DashboardSummary> {
    return timer(LATENCY_MS).pipe(
      map(() => {
        const now = new Date();
        const month = portalMonthRange(now);
        const completedThisMonth = mockBookings(now).filter(
          (b) => b.status === 'completed' && b.start >= month.start && b.start < month.end,
        ).length;

        return {
          completedThisMonth,
          completedAllTime: COMPLETED_IN_EARLIER_MONTHS + completedThisMonth,
          activeSince: parsePortalDate('2025-01-15'),
        };
      }),
    );
  }
}

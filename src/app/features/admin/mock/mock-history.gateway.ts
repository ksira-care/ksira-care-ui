import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiError } from '../../../core/http/api-error';
import { portalDay } from '../../../core/time/portal-time';
import { addMonths, portalToday } from '../../../core/time/civil-date';
import { HistoryGateway } from '../history/history.gateway';
import { HistoryExport, HistoryMonth, MonthKey } from '../history/history.models';
import { HOUR_MS } from '../../../core/time/portal-time';
import { respond } from './mock-latency';
import { MockAdminWorld, MockBooking } from './mock-admin-world';

const monthOf = (date: Date): MonthKey => portalDay(date).slice(0, 7);

@Injectable()
export class MockHistoryGateway extends HistoryGateway {
  private readonly world = inject(MockAdminWorld);

  override getMonth(month?: MonthKey): Observable<HistoryMonth> {
    return respond(() => {
      const months = this.months();
      const shown = month ?? months[0];
      if (!months.includes(shown)) throw new ApiError('HISTORY_MONTH_NOT_AVAILABLE');
      const bookings = this.bookingsIn(shown);
      const count = (outcome: MockBooking['outcome']) => bookings.filter((b) => b.outcome === outcome).length;
      return {
        month: shown,
        months,
        summary: {
          total: bookings.length,
          completed: count('completed'),
          clientNoShow: count('client-no-show'),
          refunded: count('aapta-no-show'),
          cancelled: count('cancelled'),
          pending: count('pending'),
        },
        sessions: bookings.map((b) => ({
          id: b.id,
          start: b.start,
          end: new Date(b.start.getTime() + HOUR_MS),
          client: b.client,
          aapta: this.world.ref(b.aaptaId),
          outcome: b.outcome,
          refunded: b.outcome === 'aapta-no-show',
          notes: b.notes,
        })),
        olderMonthsNotExported: [],
      };
    });
  }

  override exportLastMonth(): Observable<HistoryExport> {
    return respond(() => {
      const month = this.months()[1];
      const rows = this.bookingsIn(month).map((b) =>
        [b.id, portalDay(b.start), b.client.name, b.client.email, this.world.ref(b.aaptaId)?.firstName ?? '-', b.outcome]
          .map((cell) => `"${cell}"`)
          .join(','),
      );
      const csv = ['"Booking ID","Date","Client name","Client email","Aapta","Outcome"', ...rows].join('\r\n');
      return {
        file: new Blob([csv], { type: 'text/csv' }),
        filename: `ksira-sessions-${month}.csv`,
        deletedMonths: [],
        notExportedMonths: [],
      };
    });
  }

  /** This month and last, newest first. */
  private months(): MonthKey[] {
    const today = portalToday(this.world.now());
    return [today.slice(0, 7), addMonths(today, -1).slice(0, 7)];
  }

  private bookingsIn(month: MonthKey): MockBooking[] {
    return this.world.bookings
      .filter((b) => monthOf(b.start) === month)
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }
}

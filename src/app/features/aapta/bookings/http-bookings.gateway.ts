import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { EpochMillis, fromEpoch, fromOptionalEpoch, toEpoch } from '../../../core/http/wire-time';
import { DateRange } from '../../../core/time/portal-time';
import { Booking, BookingStatus, AaptaSetStatus } from './booking.models';
import { BookingsGateway } from './bookings.gateway';

// ── Wire format ──────────────────────────────────────────────

type BookingStatusDto = 'PENDING' | 'COMPLETED' | 'CLIENT_NO_SHOW' | 'AAPTA_NO_SHOW';

interface BookingDto {
  readonly bookingId: string;
  readonly startTime: EpochMillis;
  readonly endTime: EpochMillis;
  readonly customerName: string;
  readonly bookingReason: string | null;
  readonly bookingStatus: BookingStatusDto;
  readonly customerPreferredLanguages: readonly string[];
  readonly assignedAt: EpochMillis | null;
  readonly rescheduledFrom: EpochMillis | null;
  readonly rescheduleNote: string | null;
  readonly markedAt: EpochMillis | null;
}

interface BookingsResponseDto {
  readonly bookings: readonly BookingDto[];
}

const STATUS_BY_WIRE: Readonly<Record<BookingStatusDto, BookingStatus>> = {
  PENDING: 'scheduled',
  COMPLETED: 'completed',
  CLIENT_NO_SHOW: 'client-no-show',
  AAPTA_NO_SHOW: 'aapta-no-show',
};

const WIRE_BY_STATUS: Readonly<Record<AaptaSetStatus, BookingStatusDto>> = {
  scheduled: 'PENDING',
  completed: 'COMPLETED',
  'client-no-show': 'CLIENT_NO_SHOW',
};

function toBooking(dto: BookingDto): Booking {
  return {
    id: dto.bookingId,
    start: fromEpoch(dto.startTime),
    end: fromEpoch(dto.endTime),
    clientName: dto.customerName,
    reason: dto.bookingReason ?? '',
    // A status this app doesn't know yet is shown neutrally rather than guessed at.
    status: STATUS_BY_WIRE[dto.bookingStatus] ?? 'unknown',
    clientLanguages: dto.customerPreferredLanguages,
    assignedAt: fromOptionalEpoch(dto.assignedAt),
    rescheduledFrom: fromOptionalEpoch(dto.rescheduledFrom),
    rescheduleNote: dto.rescheduleNote || null,
    markedAt: fromOptionalEpoch(dto.markedAt),
  };
}

// ── Gateway ──────────────────────────────────────────────────

@Injectable()
export class HttpBookingsGateway extends BookingsGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/bookings`;

  override getBookings(range: DateRange): Observable<Booking[]> {
    const params = new HttpParams()
      .set('startTime', toEpoch(range.start))
      .set('endTime', toEpoch(range.end));

    return this.http
      .get<BookingsResponseDto>(this.url, { params })
      .pipe(map((response) => response.bookings.map(toBooking)));
  }

  override updateStatus(bookingId: string, status: AaptaSetStatus): Observable<void> {
    return this.http
      .patch<void>(`${this.url}/${encodeURIComponent(bookingId)}`, {
        bookingStatus: WIRE_BY_STATUS[status],
      })
      .pipe(map(() => undefined));
  }
}

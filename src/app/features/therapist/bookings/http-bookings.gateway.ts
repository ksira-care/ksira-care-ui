import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { WireTime, fromWireTime, normaliseEnum, toEpoch } from '../../../core/http/wire-time';
import { DateRange } from '../portal-time';
import { Booking, BookingStatus, TherapistSetStatus } from './booking.models';
import { BookingsGateway } from './bookings.gateway';

// ── Wire format ──────────────────────────────────────────────

interface BookingDto {
  readonly bookingId: string;
  readonly startTime: WireTime;
  readonly endTime: WireTime;
  readonly customerName: string;
  readonly bookingReason: string;
  readonly bookingStatus: string;
  readonly customerPreferredLanguages?: readonly string[];
  // Requested from backend; optional until they ship.
  readonly assignedAt?: WireTime | null;
  readonly rescheduledFrom?: WireTime | null;
  readonly rescheduleNote?: string | null;
  readonly markedAt?: WireTime | null;
}

interface BookingsResponseDto {
  readonly bookings: readonly BookingDto[];
}

// Normalised so "CLIENT NO-SHOW", "CLIENT_NO_SHOW" and "client-no-show" all match.
const STATUS_BY_WIRE: Readonly<Record<string, BookingStatus>> = {
  PENDING: 'scheduled',
  COMPLETED: 'completed',
  CLIENT_NO_SHOW: 'client-no-show',
  THERAPIST_NO_SHOW: 'therapist-no-show',
};

const WIRE_BY_STATUS: Readonly<Record<TherapistSetStatus, string>> = {
  scheduled: 'PENDING',
  completed: 'COMPLETED',
  'client-no-show': 'CLIENT_NO_SHOW',
};

function toStatus(wire: string): BookingStatus {
  return STATUS_BY_WIRE[normaliseEnum(wire)] ?? 'unknown';
}

const optionalTime = (value: WireTime | null | undefined) =>
  value === null || value === undefined ? null : fromWireTime(value);

function toBooking(dto: BookingDto): Booking {
  return {
    id: dto.bookingId,
    start: fromWireTime(dto.startTime),
    end: fromWireTime(dto.endTime),
    clientName: dto.customerName,
    reason: dto.bookingReason,
    status: toStatus(dto.bookingStatus),
    clientLanguages: dto.customerPreferredLanguages ?? [],
    assignedAt: optionalTime(dto.assignedAt),
    rescheduledFrom: optionalTime(dto.rescheduledFrom),
    rescheduleNote: dto.rescheduleNote || null,
    markedAt: optionalTime(dto.markedAt),
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

  override updateStatus(bookingId: string, status: TherapistSetStatus): Observable<void> {
    return this.http
      .patch<void>(`${this.url}/${encodeURIComponent(bookingId)}`, {
        bookingStatus: WIRE_BY_STATUS[status],
      })
      .pipe(map(() => undefined));
  }
}

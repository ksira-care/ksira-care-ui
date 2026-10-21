import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { mapApiErrors } from '../../../core/http/api-error';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { EpochMillis, fromEpoch } from '../../../core/http/wire-time';
import { CivilDate } from '../../../core/time/civil-date';
import { AaptaRef, OUTCOME_BY_WIRE } from '../admin.models';
import { TodayGateway } from './today.gateway';
import { AdminBooking, AllocationChange, BookingForm } from './today.models';

// ── Wire format ──────────────────────────────────────────────

interface AaptaRefDto {
  readonly aaptaId: string;
  readonly firstName: string;
  readonly lastName: string;
}

interface AdminBookingDto {
  readonly bookingId: string;
  readonly startTime: EpochMillis;
  readonly endTime: EpochMillis;
  readonly client: { readonly name: string; readonly email: string };
  readonly clientLanguages: readonly string[];
  readonly aapta: AaptaRefDto | null;
  readonly previousAapta: AaptaRefDto | null;
  readonly bccEmailSent: boolean;
  readonly bookingStatus: string;
  readonly editable: boolean;
  readonly editableFrom: EpochMillis;
  readonly cancellable: boolean;
  readonly cancelReason: string | null;
  readonly version: number;
}

interface BookingFormDto {
  readonly name: string;
  readonly email: string;
  readonly languages: readonly string[];
  readonly notes: string | null;
  readonly consent: boolean;
  readonly submittedAt: EpochMillis;
}

export function toAaptaRef(dto: AaptaRefDto): AaptaRef {
  return { id: dto.aaptaId, firstName: dto.firstName, lastName: dto.lastName };
}

function toBooking(dto: AdminBookingDto): AdminBooking {
  return {
    id: dto.bookingId,
    start: fromEpoch(dto.startTime),
    end: fromEpoch(dto.endTime),
    client: dto.client,
    clientLanguages: dto.clientLanguages,
    aapta: dto.aapta && toAaptaRef(dto.aapta),
    previousAapta: dto.previousAapta && toAaptaRef(dto.previousAapta),
    bccEmailSent: dto.bccEmailSent,
    outcome: OUTCOME_BY_WIRE[dto.bookingStatus] ?? 'pending',
    editable: dto.editable,
    editableFrom: fromEpoch(dto.editableFrom),
    cancellable: dto.cancellable,
    cancelReason: dto.cancelReason,
    version: dto.version,
  };
}

// ── Gateway ──────────────────────────────────────────────────

@Injectable()
export class HttpTodayGateway extends TodayGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/admin/bookings`;

  override getDay(date: CivilDate): Observable<AdminBooking[]> {
    return this.http
      .get<{ bookings: AdminBookingDto[] }>(this.url, { params: new HttpParams().set('date', date) })
      .pipe(map((response) => response.bookings.map(toBooking)), mapApiErrors());
  }

  override getForm(bookingId: string): Observable<BookingForm> {
    return this.http.get<BookingFormDto>(`${this.bookingUrl(bookingId)}/form`).pipe(
      map((dto) => ({ ...dto, submittedAt: fromEpoch(dto.submittedAt) })),
      mapApiErrors(),
    );
  }

  override getAaptaOptions(bookingId: string): Observable<AaptaRef[]> {
    return this.http
      .get<{ aaptas: AaptaRefDto[] }>(`${this.bookingUrl(bookingId)}/aapta-options`)
      .pipe(map((response) => response.aaptas.map(toAaptaRef)), mapApiErrors());
  }

  override allocate(bookingId: string, change: AllocationChange): Observable<AdminBooking> {
    return this.http
      .patch<AdminBookingDto>(this.bookingUrl(bookingId), change)
      .pipe(map(toBooking), mapApiErrors());
  }

  override cancel(bookingId: string, reason: string, version: number): Observable<AdminBooking> {
    return this.http
      .post<AdminBookingDto>(`${this.bookingUrl(bookingId)}/cancel`, { reason, version })
      .pipe(map(toBooking), mapApiErrors());
  }

  private bookingUrl(bookingId: string): string {
    return `${this.url}/${encodeURIComponent(bookingId)}`;
  }
}

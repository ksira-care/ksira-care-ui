import { HttpClient, HttpErrorResponse, HttpParams, HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { EpochMillis, fromEpoch, toEpoch } from '../../../core/http/wire-time';
import { DateRange, HOUR_MS } from '../../../core/time/portal-time';
import { AvailabilityGateway } from './availability.gateway';
import { AvailabilityError, Slot, SlotChange, SlotStatus } from './availability.models';

/** The aapta is identified by the session cookie, never by an id in the URL. */
const SLOTS_PATH = '/aaptas/me/slots';

// ── Wire format ──────────────────────────────────────────────

type SlotStatusDto = 'AAPTA_AVAILABLE' | 'AAPTA_UNAVAILABLE' | 'BOOKED';

interface SlotDto {
  readonly id: string | null;
  /** Start of the hour. */
  readonly time: EpochMillis;
  readonly status: SlotStatusDto;
}

interface SlotsResponseDto {
  readonly slots: readonly SlotDto[];
}

const STATUS_BY_WIRE: Readonly<Record<SlotStatusDto, SlotStatus>> = {
  AAPTA_AVAILABLE: 'open',
  AAPTA_UNAVAILABLE: 'closed',
  BOOKED: 'booked',
};

/** An unrecognised status is locked, so the portal never overwrites something it doesn't understand. */
function toSlot(dto: SlotDto): Slot {
  return {
    id: dto.id,
    start: fromEpoch(dto.time),
    status: STATUS_BY_WIRE[dto.status] ?? 'booked',
  };
}

function toDto(change: SlotChange): SlotDto {
  return { id: change.id, time: toEpoch(change.start), status: change.open ? 'AAPTA_AVAILABLE' : 'AAPTA_UNAVAILABLE' };
}

function rangeParams(range: DateRange): HttpParams {
  return new HttpParams().set('startTime', toEpoch(range.start)).set('endTime', toEpoch(range.end));
}

// ── Gateway ──────────────────────────────────────────────────

@Injectable()
export class HttpAvailabilityGateway extends AvailabilityGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}${SLOTS_PATH}`;

  override getSlots(range: DateRange): Observable<Slot[]> {
    return this.http
      .get<SlotsResponseDto>(this.url, { params: rangeParams(range) })
      .pipe(map((response) => response.slots.map(toSlot)));
  }

  override saveChanges(changes: readonly SlotChange[]): Observable<void> {
    if (changes.length === 0) return of(undefined);

    const times = changes.map((c) => c.start.getTime());
    const range = { start: new Date(Math.min(...times)), end: new Date(Math.max(...times) + HOUR_MS) };

    return this.http.post<SlotsResponseDto>(this.url, changes.map(toDto), { params: rangeParams(range) }).pipe(
      map(() => undefined),
      catchError((error: unknown) => {
        const conflict =
          error instanceof HttpErrorResponse && error.status === HttpStatusCode.Conflict;
        return throwError(() => new AvailabilityError(conflict ? 'conflict' : 'unknown', { cause: error }));
      }),
    );
  }
}

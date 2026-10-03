import { HttpClient, HttpErrorResponse, HttpParams, HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { WireTime, fromWireTime, normaliseEnum, toEpoch } from '../../../core/http/wire-time';
import { DateRange, HOUR_MS } from '../portal-time';
import { AvailabilityGateway } from './availability.gateway';
import { AvailabilityError, Slot, SlotChange, SlotStatus } from './availability.models';

/** The therapist is identified by the session cookie, never by an id in the URL. */
const SLOTS_PATH = '/therapists/me/slots';

// ── Wire format ──────────────────────────────────────────────

interface SlotDto {
  readonly id?: string | null;
  /** Start of the hour. */
  readonly time: WireTime;
  readonly status: string;
}

const AVAILABLE = 'THERAPIST_AVAILABLE';
const UNAVAILABLE = 'THERAPIST_UNAVAILABLE';

const STATUS_BY_WIRE: Readonly<Record<string, SlotStatus>> = {
  BOOKED: 'booked',
  [AVAILABLE]: 'open',
  [UNAVAILABLE]: 'closed',
  // Spelling in the first draft of the API contract.
  THERAPIST_UNVAILABLE: 'closed',
};

/** Unrecognised statuses are locked, so the portal never overwrites something it doesn't understand. */
function toSlot(dto: SlotDto): Slot {
  return {
    id: dto.id ?? null,
    start: fromWireTime(dto.time),
    status: STATUS_BY_WIRE[normaliseEnum(dto.status)] ?? 'booked',
  };
}

function toDto(change: SlotChange): SlotDto {
  return { id: change.id, time: toEpoch(change.start), status: change.open ? AVAILABLE : UNAVAILABLE };
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
      .get<readonly SlotDto[]>(this.url, { params: rangeParams(range) })
      .pipe(map((slots) => slots.map(toSlot)));
  }

  override saveChanges(changes: readonly SlotChange[]): Observable<void> {
    if (changes.length === 0) return of(undefined);

    const times = changes.map((c) => c.start.getTime());
    const range = { start: new Date(Math.min(...times)), end: new Date(Math.max(...times) + HOUR_MS) };

    return this.http.post<void>(this.url, changes.map(toDto), { params: rangeParams(range) }).pipe(
      map(() => undefined),
      catchError((error: unknown) => {
        const conflict =
          error instanceof HttpErrorResponse && error.status === HttpStatusCode.Conflict;
        return throwError(() => new AvailabilityError(conflict ? 'conflict' : 'unknown', { cause: error }));
      }),
    );
  }
}

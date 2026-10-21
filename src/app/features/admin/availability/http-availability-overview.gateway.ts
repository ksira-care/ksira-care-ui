import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { mapApiErrors } from '../../../core/http/api-error';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { EpochMillis, fromEpoch } from '../../../core/http/wire-time';
import { CivilDate } from '../../../core/time/civil-date';
import { AvailabilityOverviewGateway } from './availability-overview.gateway';
import { AvailabilityOverview, HourState } from './availability-overview.models';

interface OverviewDto {
  readonly hours: readonly { readonly time: EpochMillis; readonly openAaptas: number }[];
  readonly aaptas: readonly {
    readonly aaptaId: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly slots: readonly {
      readonly time: EpochMillis;
      readonly status: string;
      readonly booking: { readonly client: { readonly name: string } } | null;
    }[];
  }[];
}

const STATE_BY_WIRE: Readonly<Record<string, HourState>> = {
  AAPTA_AVAILABLE: 'open',
  BOOKED: 'booked',
  AAPTA_UNAVAILABLE: 'unavailable',
};

function toOverview(dto: OverviewDto): AvailabilityOverview {
  return {
    hours: dto.hours.map((hour) => ({ start: fromEpoch(hour.time), openAaptas: hour.openAaptas })),
    aaptas: dto.aaptas.map((row) => ({
      aapta: { id: row.aaptaId, firstName: row.firstName, lastName: row.lastName },
      cells: row.slots.map((slot) => ({
        start: fromEpoch(slot.time),
        state: STATE_BY_WIRE[slot.status] ?? 'unavailable',
        clientName: slot.booking?.client.name ?? null,
      })),
    })),
  };
}

@Injectable()
export class HttpAvailabilityOverviewGateway extends AvailabilityOverviewGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/admin/availability`;

  override getDay(date: CivilDate): Observable<AvailabilityOverview> {
    return this.http
      .get<OverviewDto>(this.url, { params: new HttpParams().set('date', date) })
      .pipe(map(toOverview), mapApiErrors());
  }
}

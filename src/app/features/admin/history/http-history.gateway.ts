import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { mapApiErrors } from '../../../core/http/api-error';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { EpochMillis, fromEpoch } from '../../../core/http/wire-time';
import { OUTCOME_BY_WIRE } from '../admin.models';
import { toAaptaRef } from '../today/http-today.gateway';
import { HistoryGateway } from './history.gateway';
import { HistoryExport, HistoryMonth, HistorySummary, MonthKey } from './history.models';

interface HistoryDto {
  readonly month: MonthKey;
  readonly months: readonly MonthKey[];
  readonly summary: HistorySummary;
  readonly sessions: readonly {
    readonly bookingId: string;
    readonly startTime: EpochMillis;
    readonly endTime: EpochMillis;
    readonly client: { readonly name: string; readonly email: string };
    readonly aapta: { readonly aaptaId: string; readonly firstName: string; readonly lastName: string } | null;
    readonly bookingStatus: string;
    readonly refunded: boolean;
    readonly notes: string | null;
  }[];
  readonly olderMonthsNotExported: readonly MonthKey[];
}

function toMonth(dto: HistoryDto): HistoryMonth {
  return {
    ...dto,
    sessions: dto.sessions.map((session) => ({
      id: session.bookingId,
      start: fromEpoch(session.startTime),
      end: fromEpoch(session.endTime),
      client: session.client,
      aapta: session.aapta && toAaptaRef(session.aapta),
      outcome: OUTCOME_BY_WIRE[session.bookingStatus] ?? 'pending',
      refunded: session.refunded,
      notes: session.notes,
    })),
  };
}

const months = (header: string | null): MonthKey[] => (header ? header.split(',').filter(Boolean) : []);

function toExport(response: HttpResponse<Blob>): HistoryExport {
  const disposition = response.headers.get('Content-Disposition') ?? '';
  return {
    file: response.body ?? new Blob(),
    filename: /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? 'ksira-sessions.csv',
    deletedMonths: months(response.headers.get('X-Deleted-Months')),
    notExportedMonths: months(response.headers.get('X-Not-Exported-Months')),
  };
}

@Injectable()
export class HttpHistoryGateway extends HistoryGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/admin/history`;

  override getMonth(month?: MonthKey): Observable<HistoryMonth> {
    const params = month ? new HttpParams().set('month', month) : undefined;
    return this.http.get<HistoryDto>(this.url, { params }).pipe(map(toMonth), mapApiErrors());
  }

  override exportLastMonth(): Observable<HistoryExport> {
    return this.http
      .post(`${this.url}/export`, null, { observe: 'response', responseType: 'blob' })
      .pipe(map(toExport), mapApiErrors());
  }
}

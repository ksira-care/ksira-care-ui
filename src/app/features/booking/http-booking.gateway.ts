import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { mapApiErrors } from '../../core/http/api-error';
import { API_BASE_URL } from '../../core/http/api-base-url';
import { EpochMillis, fromEpoch, toEpoch } from '../../core/http/wire-time';
import { BookingGateway } from './booking.gateway';
import { BookableHour, BookingConfirmation, BookingRequest } from './booking.models';

interface HourDto {
  readonly startTime: EpochMillis;
  readonly endTime: EpochMillis;
}

interface BookingDto {
  readonly bookingId: string;
  readonly startTime: EpochMillis;
  readonly endTime: EpochMillis;
}

@Injectable()
export class HttpBookingGateway extends BookingGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/public`;

  override getBookableHours(languages: readonly string[], until: Date): Observable<BookableHour[]> {
    const params = new HttpParams()
      .set('startTime', toEpoch(new Date()))
      .set('endTime', toEpoch(until))
      .set('languages', languages.join(','));
    return this.http.get<{ hours: HourDto[] }>(`${this.url}/availability`, { params }).pipe(
      map((response) => response.hours.map((hour) => ({ start: fromEpoch(hour.startTime), end: fromEpoch(hour.endTime) }))),
      mapApiErrors(),
    );
  }

  override book(request: BookingRequest): Observable<BookingConfirmation> {
    const body = {
      name: request.name,
      email: request.email,
      startTime: toEpoch(request.start),
      languages: request.languages,
      notes: request.notes,
      consent: true,
    };
    return this.http.post<BookingDto>(`${this.url}/bookings`, body).pipe(
      map((dto) => ({ id: dto.bookingId, start: fromEpoch(dto.startTime), end: fromEpoch(dto.endTime) })),
      mapApiErrors(),
    );
  }
}

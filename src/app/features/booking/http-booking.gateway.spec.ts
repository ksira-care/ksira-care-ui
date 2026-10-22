import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '../../core/http/api-error';
import { API_BASE_URL } from '../../core/http/api-base-url';
import { HttpBookingGateway } from './http-booking.gateway';

describe('HttpBookingGateway', () => {
  let gateway: HttpBookingGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpBookingGateway, provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }],
    });
    gateway = TestBed.inject(HttpBookingGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks for free hours by language code, up to the end of the window', async () => {
    const until = new Date('2026-12-21T00:00:00Z');
    const result = firstValueFrom(gateway.getBookableHours(['hi', 'en'], until));

    const req = http.expectOne((r) => r.url === '/api/public/availability');
    expect(req.request.params.get('languages')).toBe('hi,en');
    expect(req.request.params.get('endTime')).toBe(String(until.getTime()));
    req.flush({ hours: [{ startTime: 1_000, endTime: 2_000 }] });

    expect(await result).toEqual([{ start: new Date(1_000), end: new Date(2_000) }]);
  });

  it('books with the time in milliseconds and consent given', async () => {
    const result = firstValueFrom(gateway.book({
      name: 'Tom', email: 'tom@example.com', start: new Date(5_000), languages: ['hi'], notes: null,
    }));

    const req = http.expectOne({ method: 'POST', url: '/api/public/bookings' });
    expect(req.request.body).toEqual({ name: 'Tom', email: 'tom@example.com', startTime: 5_000, languages: ['hi'], notes: null, consent: true });
    req.flush({ bookingId: 'bk_1', startTime: 5_000, endTime: 6_000 });

    expect((await result).id).toBe('bk_1');
  });

  it('reports a taken hour as TIME_NOT_AVAILABLE', async () => {
    const result = firstValueFrom(gateway.book({ name: 'T', email: 't@e.com', start: new Date(0), languages: ['hi'], notes: null }));
    http.expectOne('/api/public/bookings').flush({ code: 'TIME_NOT_AVAILABLE' }, { status: 409, statusText: 'Conflict' });

    const error = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'TIME_NOT_AVAILABLE' });
  });
});

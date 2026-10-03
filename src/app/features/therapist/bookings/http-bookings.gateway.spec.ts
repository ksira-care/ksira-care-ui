import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { HttpBookingsGateway } from './http-bookings.gateway';

const RANGE = {
  start: new Date('2026-09-30T18:30:00Z'), // 1 Oct 00:00 IST
  end: new Date('2026-10-31T18:30:00Z'), // 1 Nov 00:00 IST
};

describe('HttpBookingsGateway', () => {
  let gateway: HttpBookingsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpBookingsGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    gateway = TestBed.inject(HttpBookingsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function respond(bookings: unknown[]): void {
    const req = http.expectOne((r) => r.url === '/api/bookings');
    expect(req.request.params.get('startTime')).toBe(String(RANGE.start.getTime()));
    expect(req.request.params.get('endTime')).toBe(String(RANGE.end.getTime()));
    req.flush({ therapistName: 'Aanya Mehta', bookings });
  }

  it('requests the range as epoch milliseconds and maps each booking', async () => {
    const result = firstValueFrom(gateway.getBookings(RANGE));
    respond([
      {
        bookingId: 'bk_1',
        startTime: 1_791_300_600_000,
        endTime: 1_791_304_200_000,
        customerName: 'Sara Lopez',
        bookingReason: 'Work stress',
        bookingStatus: 'COMPLETED',
        customerPreferredLanguages: ['en'],
      },
    ]);

    expect(await result).toEqual([
      {
        id: 'bk_1',
        start: new Date(1_791_300_600_000),
        end: new Date(1_791_304_200_000),
        clientName: 'Sara Lopez',
        reason: 'Work stress',
        status: 'completed',
        clientLanguages: ['en'],
        assignedAt: null,
        rescheduledFrom: null,
        rescheduleNote: null,
        markedAt: null,
      },
    ]);
  });

  it('maps assignment and reschedule details when the API sends them', async () => {
    const result = firstValueFrom(gateway.getBookings(RANGE));
    respond([
      {
        bookingId: 'bk_2',
        startTime: 1_791_300_600_000,
        endTime: 1_791_304_200_000,
        customerName: 'Lena Kruger',
        bookingReason: 'Venting',
        bookingStatus: 'PENDING',
        assignedAt: 1_791_000_000_000,
        rescheduledFrom: 1_791_214_200_000,
        rescheduleNote: 'Client requested the change by email.',
      },
    ]);
    const [booking] = await result;

    expect(booking.assignedAt).toEqual(new Date(1_791_000_000_000));
    expect(booking.rescheduledFrom).toEqual(new Date(1_791_214_200_000));
    expect(booking.rescheduleNote).toBe('Client requested the change by email.');
  });

  it.each([
    ['completed', 'COMPLETED'],
    ['client-no-show', 'CLIENT_NO_SHOW'],
    ['scheduled', 'PENDING'],
  ] as const)('sets status %s as %s', async (status, wire) => {
    const result = firstValueFrom(gateway.updateStatus('bk 1', status));

    const req = http.expectOne('/api/bookings/bk%201');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ bookingStatus: wire });
    req.flush(null);

    await expect(result).resolves.toBeUndefined();
  });

  it.each([
    ['PENDING', 'scheduled'],
    ['CLIENT NO-SHOW', 'client-no-show'],
    ['CLIENT_NO_SHOW', 'client-no-show'],
    ['THERAPIST NO-SHOW', 'therapist-no-show'],
    ['CANCELLED', 'unknown'],
  ])('maps status %s to %s', async (wire, expected) => {
    const result = firstValueFrom(gateway.getBookings(RANGE));
    respond([{ bookingId: 'b', startTime: 0, endTime: 0, customerName: '', bookingReason: '', bookingStatus: wire }]);

    expect((await result)[0].status).toBe(expected);
  });

  it('accepts epoch seconds and ISO strings as well as milliseconds', async () => {
    const result = firstValueFrom(gateway.getBookings(RANGE));
    respond([
      { bookingId: 's', startTime: 1_791_300_600, endTime: 1_791_304_200, customerName: '', bookingReason: '', bookingStatus: 'PENDING' },
      { bookingId: 'i', startTime: '2026-10-07T12:00:00Z', endTime: '2026-10-07T13:00:00Z', customerName: '', bookingReason: '', bookingStatus: 'PENDING' },
    ]);
    const [seconds, iso] = await result;

    expect(seconds.start).toEqual(new Date(1_791_300_600_000));
    expect(iso.start).toEqual(new Date('2026-10-07T12:00:00Z'));
    expect(iso.clientLanguages).toEqual([]);
  });
});

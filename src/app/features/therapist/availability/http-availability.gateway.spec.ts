import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { AvailabilityError } from './availability.models';
import { HttpAvailabilityGateway } from './http-availability.gateway';

const ist = (isoLocal: string) => new Date(`${isoLocal}+05:30`);
const RANGE = { start: ist('2026-10-03T00:00'), end: ist('2026-12-03T00:00') };

describe('HttpAvailabilityGateway', () => {
  let gateway: HttpAvailabilityGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpAvailabilityGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    gateway = TestBed.inject(HttpAvailabilityGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the session’s slots for a range and maps statuses', async () => {
    const result = firstValueFrom(gateway.getSlots(RANGE));

    const req = http.expectOne((r) => r.url === '/api/therapists/me/slots');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('startTime')).toBe(String(RANGE.start.getTime()));
    expect(req.request.params.get('endTime')).toBe(String(RANGE.end.getTime()));
    expect(req.request.params.has('therapistId')).toBe(false);

    const nine = ist('2026-10-05T09:00').getTime();
    req.flush([
      { id: 's1', time: nine, status: 'THERAPIST_AVAILABLE' },
      { id: 's2', time: nine + 3_600_000, status: 'THERAPIST_UNVAILABLE' },
      { id: 's3', time: nine + 7_200_000, status: 'BOOKED' },
      { id: 's4', time: nine + 10_800_000, status: 'SOMETHING_NEW' },
    ]);

    expect((await result).map((s) => [s.id, s.status])).toEqual([
      ['s1', 'open'],
      ['s2', 'closed'],
      ['s3', 'booked'],
      ['s4', 'booked'], // unknown → locked, never overwritten
    ]);
  });

  it('sends only the changed hours, with the range they cover', async () => {
    const result = firstValueFrom(
      gateway.saveChanges([
        { id: 's1', start: ist('2026-10-05T09:00'), open: false },
        { id: null, start: ist('2026-10-06T14:00'), open: true },
      ]),
    );

    const req = http.expectOne((r) => r.url === '/api/therapists/me/slots');
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get('startTime')).toBe(String(ist('2026-10-05T09:00').getTime()));
    expect(req.request.params.get('endTime')).toBe(String(ist('2026-10-06T15:00').getTime()));
    expect(req.request.body).toEqual([
      { id: 's1', time: ist('2026-10-05T09:00').getTime(), status: 'THERAPIST_UNAVAILABLE' },
      { id: null, time: ist('2026-10-06T14:00').getTime(), status: 'THERAPIST_AVAILABLE' },
    ]);
    req.flush(null);

    await expect(result).resolves.toBeUndefined();
  });

  it('reports a conflict when an hour was booked meanwhile', async () => {
    const result = firstValueFrom(
      gateway.saveChanges([{ id: 's1', start: ist('2026-10-05T09:00'), open: false }]),
    );
    http.expectOne(() => true).flush({ code: 'CONFLICT' }, { status: 409, statusText: 'Conflict' });

    const error = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AvailabilityError);
    expect(error).toMatchObject({ code: 'conflict' });
  });

  it('does not call the API when there is nothing to save', async () => {
    await expect(firstValueFrom(gateway.saveChanges([]))).resolves.toBeUndefined();
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { HttpTodayGateway } from './http-today.gateway';

const ROW = {
  bookingId: 'bk 1', startTime: 1_000, endTime: 2_000,
  client: { name: 'Farah Ali', email: 'farah@example.com' }, clientLanguages: ['hi'],
  aapta: { aaptaId: 'ap_1', firstName: 'Aanya', lastName: 'Mehta' }, previousAapta: null,
  bccEmailSent: true, bookingStatus: 'PENDING', markedAt: null, editable: true, editableFrom: 500,
  cancellable: true, cancelReason: null, version: 7,
};

describe('HttpTodayGateway', () => {
  let gateway: HttpTodayGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpTodayGateway, provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }],
    });
    gateway = TestBed.inject(HttpTodayGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads a day and maps each row', async () => {
    const result = firstValueFrom(gateway.getDay('2026-10-21'));
    http.expectOne('/api/admin/bookings?date=2026-10-21').flush({ date: '2026-10-21', bookings: [ROW] });

    expect(await result).toEqual([expect.objectContaining({
      id: 'bk 1', start: new Date(1_000), outcome: 'pending', clientLanguages: ['hi'],
      aapta: { id: 'ap_1', firstName: 'Aanya', lastName: 'Mehta' }, editableFrom: new Date(500), version: 7,
    })]);
  });

  it('sends allocation with the version it was loaded at', async () => {
    const result = firstValueFrom(gateway.allocate('bk 1', { aaptaId: 'ap_1', bccEmailSent: true, version: 7 }));
    const req = http.expectOne({ method: 'PATCH', url: '/api/admin/bookings/bk%201' });
    expect(req.request.body).toEqual({ aaptaId: 'ap_1', bccEmailSent: true, version: 7 });
    req.flush(ROW);
    await result;
  });

  it('cancels with a reason', async () => {
    const result = firstValueFrom(gateway.cancel('bk 1', 'Client asked', 7));
    const req = http.expectOne({ method: 'POST', url: '/api/admin/bookings/bk%201/cancel' });
    expect(req.request.body).toEqual({ reason: 'Client asked', version: 7 });
    req.flush({ ...ROW, bookingStatus: 'CANCELLED', cancelReason: 'Client asked' });
    expect((await result).outcome).toBe('cancelled');
  });
});

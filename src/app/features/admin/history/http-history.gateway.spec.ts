import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '../../../core/http/api-error';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { HttpHistoryGateway } from './http-history.gateway';

describe('HttpHistoryGateway', () => {
  let gateway: HttpHistoryGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpHistoryGateway, provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }],
    });
    gateway = TestBed.inject(HttpHistoryGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the file name and the months the export deleted or kept', async () => {
    const result = firstValueFrom(gateway.exportLastMonth());

    const req = http.expectOne({ method: 'POST', url: '/api/admin/history/export' });
    req.flush(new Blob(['csv']), {
      headers: {
        'Content-Disposition': 'attachment; filename="ksira-sessions-2026-09.csv"',
        'X-Deleted-Months': '2026-07,2026-06',
        'X-Not-Exported-Months': '',
      },
    });

    expect(await result).toMatchObject({
      filename: 'ksira-sessions-2026-09.csv',
      deletedMonths: ['2026-07', '2026-06'],
      notExportedMonths: [],
    });
  });

  it('maps outcomes and turns failures into ApiErrors', async () => {
    const month = firstValueFrom(gateway.getMonth('2026-09'));
    http.expectOne('/api/admin/history?month=2026-09').flush({
      month: '2026-09', months: ['2026-10', '2026-09'],
      summary: { total: 1, completed: 0, clientNoShow: 0, refunded: 1, cancelled: 0, pending: 0 },
      sessions: [{ bookingId: 'b', startTime: 0, endTime: 1, client: { name: 'T', email: 't@e.com' }, aapta: null,
                   bookingStatus: 'AAPTA_NO_SHOW', refunded: true, notes: null }],
      olderMonthsNotExported: [],
    });
    expect((await month).sessions[0].outcome).toBe('aapta-no-show');

    const failed = firstValueFrom(gateway.getMonth('2020-01'));
    http.expectOne('/api/admin/history?month=2020-01')
      .flush({ code: 'HISTORY_MONTH_NOT_AVAILABLE' }, { status: 400, statusText: 'Bad Request' });
    const error = await failed.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'HISTORY_MONTH_NOT_AVAILABLE' });
  });
});

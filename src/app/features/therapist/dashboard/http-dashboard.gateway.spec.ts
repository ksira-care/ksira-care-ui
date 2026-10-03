import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { HttpDashboardGateway } from './http-dashboard.gateway';

describe('HttpDashboardGateway', () => {
  let gateway: HttpDashboardGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpDashboardGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    gateway = TestBed.inject(HttpDashboardGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the summary and reads activeSince as an IST date', async () => {
    const result = firstValueFrom(gateway.getSummary());
    http.expectOne({ method: 'GET', url: '/api/therapists/me/dashboard-summary' }).flush({
      completedThisMonth: 14,
      completedAllTime: 128,
      activeSince: '2025-01-01',
    });

    expect(await result).toEqual({
      completedThisMonth: 14,
      completedAllTime: 128,
      // Midnight IST on 1 Jan is still 31 Dec in UTC.
      activeSince: new Date('2024-12-31T18:30:00Z'),
    });
  });

  it('treats a missing activeSince as unknown', async () => {
    const result = firstValueFrom(gateway.getSummary());
    http.expectOne('/api/therapists/me/dashboard-summary').flush({
      completedThisMonth: 0,
      completedAllTime: 0,
    });

    expect((await result).activeSince).toBeNull();
  });
});

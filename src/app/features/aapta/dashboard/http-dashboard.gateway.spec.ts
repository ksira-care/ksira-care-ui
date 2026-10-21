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

  it('loads the summary', async () => {
    const result = firstValueFrom(gateway.getSummary());
    http.expectOne({ method: 'GET', url: '/api/aaptas/me/dashboard-summary' }).flush({
      completedThisMonth: 14,
      completedLast30Days: 21,
    });

    expect(await result).toEqual({ completedThisMonth: 14, completedLast30Days: 21 });
  });
});

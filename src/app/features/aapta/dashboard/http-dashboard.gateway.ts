import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardSummary } from './dashboard.models';

/** The API's summary already has the app's shape. */
@Injectable()
export class HttpDashboardGateway extends DashboardGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/aaptas/me/dashboard-summary`;

  override getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.url);
  }
}

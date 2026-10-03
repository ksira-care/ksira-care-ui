import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { parsePortalDate } from '../portal-time';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardSummary } from './dashboard.models';

interface DashboardSummaryDto {
  readonly completedThisMonth: number;
  readonly completedAllTime: number;
  /** YYYY-MM-DD; optional until the backend confirms it. */
  readonly activeSince?: string | null;
}

@Injectable()
export class HttpDashboardGateway extends DashboardGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  override getSummary(): Observable<DashboardSummary> {
    return this.http
      .get<DashboardSummaryDto>(`${this.baseUrl}/therapists/me/dashboard-summary`)
      .pipe(map(toSummary));
  }
}

function toSummary(dto: DashboardSummaryDto): DashboardSummary {
  return {
    completedThisMonth: dto.completedThisMonth,
    completedAllTime: dto.completedAllTime,
    activeSince: dto.activeSince ? parsePortalDate(dto.activeSince) : null,
  };
}

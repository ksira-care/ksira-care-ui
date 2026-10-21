import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CivilDate } from '../../../core/time/civil-date';
import { AvailabilityOverviewGateway } from '../availability/availability-overview.gateway';
import { AvailabilityOverview } from '../availability/availability-overview.models';
import { respond } from './mock-latency';
import { MockAdminWorld } from './mock-admin-world';

@Injectable()
export class MockAvailabilityOverviewGateway extends AvailabilityOverviewGateway {
  private readonly world = inject(MockAdminWorld);

  override getDay(date: CivilDate): Observable<AvailabilityOverview> {
    return respond(() => {
      const starts = this.world.sessionStarts(date);
      const aaptas = this.world.aaptas.map((aapta) => ({
        aapta: this.world.ref(aapta.id)!,
        cells: starts.map((start) => {
          const state = this.world.hourState(aapta.id, start);
          const booking = this.world.bookings.find(
            (b) => b.aaptaId === aapta.id && b.start.getTime() === start.getTime() && b.outcome !== 'cancelled',
          );
          return { start, state, clientName: state === 'booked' ? (booking?.client.name ?? null) : null };
        }),
      }));
      const hours = starts.map((start, i) => ({
        start,
        openAaptas: aaptas.filter((row) => row.cells[i].state === 'open').length,
      }));
      return { hours, aaptas };
    });
  }
}

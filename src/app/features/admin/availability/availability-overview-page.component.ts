import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CivilDate, portalToday, startOf } from '../../../core/time/civil-date';
import { PORTAL_TIME_ZONE_LABEL, formatLongDate, formatTime } from '../../../core/time/portal-time';
import { DateStripComponent } from '../../../shared/ui/date-strip.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error.component';
import { shortName } from '../admin.models';
import { AvailabilityOverviewGateway } from './availability-overview.gateway';
import { AvailabilityCell } from './availability-overview.models';
import { LoadingRowsComponent } from '../../../shared/ui/loading-rows.component';

const STATE_LABELS = { open: 'Open', booked: 'Booked', unavailable: 'Not working' } as const;

/**
 * Every aapta's day at a glance, for any date: who is open, booked or not
 * working each hour, and how many are free. View only — aaptas set their own
 * hours, and allocation happens on the Today page. The colours match the
 * aapta portal's, so open and booked mean the same thing everywhere.
 */
@Component({
  selector: 'app-admin-availability-page',
  standalone: true,
  imports: [LoadingRowsComponent, DateStripComponent, LoadErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div>
        <h1 class="section-title page-header__title">Aapta availability</h1>
        <p class="page-header__subtitle">{{ subtitle() }}</p>
      </div>
      <app-date-strip [(date)]="date" [today]="today" label="Choose a day" />
    </header>

    <ul class="legend" role="list" aria-label="Key">
      <li><span class="cell-swatch" data-state="open"></span> Open — free to book</li>
      <li><span class="cell-swatch" data-state="booked"></span> Booked</li>
      <li><span class="cell-swatch" data-state="unavailable"></span> Not working</li>
    </ul>

    @if (overview.hasValue()) {
      @let day = overview.value();
      @if (day.aaptas.length) {
        <div class="table-scroll">
          <table class="grid">
            <caption class="visually-hidden">Each aapta's hours on {{ subtitle() }}</caption>
            <thead>
              <tr>
                <th scope="col" class="grid__name">Aapta</th>
                @for (hour of day.hours; track hour.start.getTime()) {
                  <th scope="col" class="grid__hour">{{ hourLabel(hour.start) }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of day.aaptas; track row.aapta.id) {
                <tr>
                  <th scope="row" class="grid__name">{{ short(row.aapta) }}</th>
                  @for (cell of row.cells; track cell.start.getTime()) {
                    <td>
                      <span class="cell" [attr.data-state]="cell.state" [attr.title]="describe(cell)">
                        <span class="visually-hidden">{{ describe(cell) }}</span>
                      </span>
                    </td>
                  }
                </tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" class="grid__name grid__free">Free</th>
                @for (hour of day.hours; track hour.start.getTime()) {
                  <td class="grid__count" [class.grid__count--none]="hour.openAaptas === 0">{{ hour.openAaptas }}</td>
                }
              </tr>
            </tfoot>
          </table>
        </div>
        <p class="grid__note">Hover a booked hour to see who it's for. Hours with no one free are highlighted.</p>
      } @else {
        <p class="grid__empty">No aaptas on the roster yet.</p>
      }
    } @else if (overview.error()) {
      <app-load-error message="We couldn't load availability." (retry)="overview.reload()" />
    } @else {
      <app-loading-rows label="Loading availability…" [rows]="5" />
    }
  `,
  styles: `
    :host {
      display: block;
      padding-block: var(--space-2xl);
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xs) var(--space-lg);
      margin-bottom: var(--space-md);
      font-size: 0.875rem;
      color: var(--color-text-muted);

      li { display: inline-flex; align-items: center; gap: var(--space-sm); }
    }

    .grid {
      width: 100%;
      border-collapse: separate;
      border-spacing: 4px;
      padding: var(--space-sm);
      font-size: 0.875rem;
    }

    .grid__name {
      position: sticky;
      left: 0;
      z-index: 1;
      padding-right: var(--space-md);
      background-color: var(--color-surface);
      font-weight: 600;
      text-align: left;
      white-space: nowrap;
      color: var(--color-text);
    }

    .grid__hour {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      font-variant-numeric: tabular-nums;
    }

    .cell,
    .cell-swatch {
      display: block;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      background-color: var(--color-surface);

      &[data-state='open'] { border-color: var(--color-open-border); background-color: var(--color-green-light); }
      &[data-state='booked'] { border-color: var(--color-booked-border); background-color: var(--color-booked-bg); }
      /* Not working reads as empty: plain, with no colour of its own. */
      &[data-state='unavailable'] { background-color: var(--color-surface); border-color: var(--color-border); }
    }

    .cell { width: 100%; min-width: 2rem; height: 2.25rem; }
    .cell[data-state='booked'] { cursor: help; }
    .cell-swatch { width: 14px; height: 14px; border-radius: 4px; }

    .grid__free { font-weight: 400; color: var(--color-text-muted); }

    .grid__count {
      text-align: center;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--color-text);
    }

    .grid__count--none {
      border-radius: var(--radius-sm);
      background-color: var(--color-crisis-bg);
      color: var(--color-crisis);
    }

    .grid__note {
      margin-top: var(--space-md);
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .grid__empty {
      padding: var(--space-xl);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-muted);
      text-align: center;
    }

  `,
})
export class AvailabilityOverviewPageComponent {
  private readonly gateway = inject(AvailabilityOverviewGateway);

  protected readonly today = portalToday(new Date());
  protected readonly date = signal<CivilDate>(this.today);
  protected readonly overview = rxResource({
    params: () => this.date(),
    stream: ({ params: date }) => this.gateway.getDay(date),
  });

  protected readonly subtitle = computed(
    () => `${formatLongDate(startOf(this.date()))} · all times ${PORTAL_TIME_ZONE_LABEL}`,
  );

  protected readonly short = shortName;

  protected hourLabel(start: Date): string {
    return formatTime(start).slice(0, 2);
  }

  protected describe(cell: AvailabilityCell): string {
    const state = STATE_LABELS[cell.state];
    const time = formatTime(cell.start);
    return cell.clientName ? `${time} · ${state} for ${cell.clientName}` : `${time} · ${state}`;
  }
}

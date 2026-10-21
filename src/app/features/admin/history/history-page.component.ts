import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ApiError } from '../../../core/http/api-error';
import { PORTAL_TIME_ZONE, formatDayLong, formatTime, portalDay } from '../../../core/time/portal-time';
import { LoadErrorComponent } from '../../../shared/ui/load-error.component';
import { TabBarComponent, TabOption } from '../../../shared/ui/tab-bar.component';
import { Outcome, shortName } from '../admin.models';
import { HistoryGateway } from './history.gateway';
import { HistoryExport, HistoryMonth, HistorySession, MonthKey } from './history.models';

const OUTCOMES: Readonly<Record<Outcome, { label: string; tone: string | null }>> = {
  completed: { label: 'Completed', tone: 'success' },
  'client-no-show': { label: "Client didn't join", tone: 'danger' },
  'aapta-no-show': { label: 'Aapta no-show', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: null },
  pending: { label: 'Not marked yet', tone: null },
};

/** Notes longer than this start folded to one line. */
const LONG_NOTES = 90;
const PANEL_ID = 'history-panel';

const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: PORTAL_TIME_ZONE });

/** "2026-09" → "September 2026". */
function monthLabel(month: MonthKey): string {
  return monthName.format(new Date(`${month}-15T12:00:00+05:30`));
}

/** "2026-09" → "September". */
function monthOnly(month: MonthKey): string {
  return monthLabel(month).split(' ')[0];
}

/**
 * This month and last, every session whatever happened to it, with the
 * headline numbers. "Export" always downloads last month — whichever is on
 * screen — and afterwards months older than History's window are deleted,
 * but only once they have been exported.
 */
@Component({
  selector: 'app-admin-history-page',
  standalone: true,
  imports: [TabBarComponent, LoadErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div>
        <h1 class="section-title page-header__title">History</h1>
        <p class="page-header__subtitle">This month and last · older months are deleted once they've been exported</p>
      </div>
      @if (exportMonth(); as month) {
        <button type="button" class="btn btn-outline" [disabled]="exporting()" (click)="export()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>
          </svg>
          {{ exporting() ? 'Preparing…' : 'Export ' + month + ' (CSV)' }}
        </button>
      }
    </header>

    @if (exportResult(); as result) {
      <p class="notice history__notice" [attr.data-tone]="result.tone" role="status">{{ result.text }}</p>
    }

    @if (history.hasValue()) {
      @let data = history.value();
      @if (data.olderMonthsNotExported.length) {
        <p class="notice history__notice" data-tone="warning">
          Kept because they were never exported: {{ monthList(data.olderMonthsNotExported) }}.
        </p>
      }

      <app-tab-bar #tabBar [tabs]="tabs()" [selected]="data.month" (selectedChange)="month.set($event)"
                   label="Month" [panelId]="panelId" />

      <div class="history__panel" role="tabpanel" tabindex="0" [id]="panelId" [attr.aria-labelledby]="tabBar.tabId(data.month)">
        <dl class="tiles">
          <div class="tile"><dt>Total sessions</dt><dd>{{ data.summary.total }}</dd></div>
          <div class="tile"><dt>Completed</dt><dd>{{ data.summary.completed }}</dd></div>
          <div class="tile"><dt>Refunded</dt><dd>{{ data.summary.refunded }}</dd></div>
        </dl>
        <p class="history__others">{{ otherCounts(data) }}</p>

        @if (days().length) {
          <div class="table-scroll">
            <table class="data-table">
              <caption class="visually-hidden">Sessions in {{ label(data.month) }}</caption>
              <thead>
                <tr>
                  <th scope="col">Time (IST)</th>
                  <th scope="col">Client</th>
                  <th scope="col">Aapta</th>
                  <th scope="col">Outcome</th>
                  <th scope="col">What they expected</th>
                </tr>
              </thead>
              @for (day of days(); track day.key) {
                <tbody>
                  <tr class="history__day"><th scope="rowgroup" colspan="5">{{ day.label }}</th></tr>
                  @for (session of day.sessions; track session.id) {
                    <tr>
                      <td class="history__time">{{ time(session) }}</td>
                      <td>
                        <span class="history__client">{{ session.client.name }}</span>
                        <span class="history__muted">{{ session.client.email }}</span>
                      </td>
                      <td>{{ session.aapta ? short(session.aapta) : '—' }}</td>
                      <td>
                        <span class="badge" [attr.data-tone]="outcome(session).tone">{{ outcome(session).label }}</span>
                        @if (session.refunded) {
                          <span class="history__muted">Refund the client</span>
                        }
                      </td>
                      <td class="history__notes">
                        @if (session.notes) {
                          <span class="history__note" [class.history__note--folded]="isFolded(session)">“{{ session.notes }}”</span>
                          @if (session.notes.length > longNotes) {
                            <button type="button" class="history__more" (click)="toggle(session)">
                              {{ isFolded(session) ? 'Show all' : 'Show less' }}
                            </button>
                          }
                        } @else {
                          <span class="history__muted">—</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              }
            </table>
          </div>
        } @else {
          <p class="history__empty">No sessions in {{ label(data.month) }}.</p>
        }
      </div>
    } @else if (history.error()) {
      <app-load-error message="We couldn't load History." (retry)="history.reload()" />
    } @else {
      <div class="skeleton history__loading" aria-busy="true"><span class="visually-hidden">Loading History…</span></div>
    }
  `,
  styles: `
    :host {
      display: block;
      padding-block: var(--space-2xl);
    }

    .history__notice { margin-bottom: var(--space-md); }
    .history__panel { padding-top: var(--space-lg); }

    .tiles {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--space-md);

      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }

    .tile {
      padding: var(--space-md) var(--space-lg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);

      dt { font-size: 0.875rem; color: var(--color-text-muted); }
      dd { font-family: var(--font-serif); font-size: 2rem; line-height: 1.2; color: var(--color-text); }
    }

    .history__others {
      margin-block: var(--space-sm) var(--space-lg);
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .history__day th {
      padding-block: 0.625rem;
      background-color: var(--color-surface-muted);
      font-size: 0.8125rem;
      letter-spacing: 0.04em;
      text-transform: none;
      color: var(--color-text);
    }

    td > span:not(.badge) { display: block; }

    .history__time { font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .history__client { font-weight: 600; }
    .history__muted { font-size: 0.875rem; color: var(--color-text-muted); overflow-wrap: anywhere; }

    .history__notes { max-width: 24rem; }
    .history__note { font-family: var(--font-serif); font-style: italic; color: var(--color-text-body); }

    .history__note--folded {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .history__more {
      padding: 0;
      border: none;
      background: transparent;
      font-family: var(--font-sans);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-green);
      cursor: pointer;

      &:focus-visible { outline: 2px solid var(--color-green); outline-offset: 2px; }
    }

    .history__empty {
      padding: var(--space-xl);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-muted);
      text-align: center;
    }

    .history__loading { height: 20rem; }
  `,
})
export class HistoryPageComponent {
  private readonly gateway = inject(HistoryGateway);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly panelId = PANEL_ID;
  protected readonly longNotes = LONG_NOTES;
  protected readonly short = shortName;
  protected readonly label = monthLabel;

  /** The month on screen; undefined means "the current one". */
  protected readonly month = signal<MonthKey | undefined>(undefined);
  protected readonly history = rxResource({
    params: () => ({ month: this.month() }),
    stream: ({ params }) => this.gateway.getMonth(params.month),
  });

  private readonly unfolded = signal<ReadonlySet<string>>(new Set());
  protected readonly exporting = signal(false);
  protected readonly exportResult = signal<{ tone: 'success' | 'warning' | 'error'; text: string } | null>(null);

  protected readonly tabs = computed<TabOption<MonthKey>[]>(() => {
    if (!this.history.hasValue()) return [];
    const [current, ...earlier] = this.history.value().months;
    return [
      { id: current, label: `${monthOnly(current)} (this month)` },
      ...earlier.map((month) => ({ id: month, label: monthOnly(month) })),
    ];
  });

  /** The month "Export" downloads: always last month, whichever is on screen. */
  protected readonly exportMonth = computed(() => {
    const months = this.history.hasValue() ? this.history.value().months : [];
    return months.length > 1 ? monthOnly(months[1]) : null;
  });

  /** Sessions grouped by IST day, newest first, so each row only needs its time. */
  protected readonly days = computed(() => {
    if (!this.history.hasValue()) return [];
    const groups = new Map<string, HistorySession[]>();
    for (const session of this.history.value().sessions) {
      const key = portalDay(session.start);
      groups.set(key, [...(groups.get(key) ?? []), session]);
    }
    return [...groups].map(([key, sessions]) => ({ key, label: formatDayLong(sessions[0].start), sessions }));
  });

  protected time(session: HistorySession): string {
    return formatTime(session.start);
  }

  protected outcome(session: HistorySession) {
    return OUTCOMES[session.outcome];
  }

  protected otherCounts(data: HistoryMonth): string {
    const { clientNoShow, cancelled, pending } = data.summary;
    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
    return [
      plural(clientNoShow, "client didn't join", "clients didn't join"),
      plural(cancelled, 'cancelled', 'cancelled'),
      plural(pending, 'not marked yet', 'not marked yet'),
    ].join(' · ');
  }

  protected monthList(months: readonly MonthKey[]): string {
    return months.map(monthLabel).join(', ');
  }

  protected isFolded(session: HistorySession): boolean {
    return (session.notes?.length ?? 0) > LONG_NOTES && !this.unfolded().has(session.id);
  }

  protected toggle(session: HistorySession): void {
    this.unfolded.update((ids) => {
      const next = new Set(ids);
      if (next.has(session.id)) next.delete(session.id);
      else next.add(session.id);
      return next;
    });
  }

  protected export(): void {
    this.exporting.set(true);
    this.exportResult.set(null);
    this.gateway
      .exportLastMonth()
      .pipe(
        finalize(() => this.exporting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          download(result);
          this.exportResult.set(this.describe(result));
          this.history.reload();
        },
        error: (error: unknown) =>
          this.exportResult.set({
            tone: 'error',
            text: ApiError.is(error, 'NETWORK')
              ? "We couldn't reach the server. Check your connection and try again."
              : "We couldn't prepare the export. Please try again.",
          }),
      });
  }

  private describe(result: HistoryExport): { tone: 'success' | 'warning'; text: string } {
    const parts = [`Downloaded ${result.filename}.`];
    if (result.deletedMonths.length) parts.push(`Deleted older months: ${this.monthList(result.deletedMonths)}.`);
    if (result.notExportedMonths.length) {
      parts.push(`Kept because they were never exported: ${this.monthList(result.notExportedMonths)}.`);
    }
    return { tone: result.notExportedMonths.length ? 'warning' : 'success', text: parts.join(' ') };
  }
}

/** Saves the file through the browser's normal download. */
function download({ file, filename }: HistoryExport): void {
  const url = URL.createObjectURL(file);
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url));
}

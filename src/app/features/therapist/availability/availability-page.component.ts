import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CivilDate, portalToday, startOf, startOfMonth } from '../civil-date';
import { HOUR_MS, formatDayLong, formatTime } from '../portal-time';
import { LoadErrorComponent } from '../ui/load-error.component';
import { HasUnsavedChanges } from '../unsaved-changes.guard';
import { BOOKING_WINDOW_DAYS, FIRST_HOUR, hourStarts, slotKey } from './availability-schedule';
import { AvailabilityStore } from './availability.store';
import { HourGridComponent, HourState, HourView } from './hour-grid.component';
import { MonthCalendarComponent } from './month-calendar.component';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * Where therapists choose which hours clients can book. Edits across any
 * number of days collect in a save bar and go live together.
 */
@Component({
  selector: 'app-availability-page',
  standalone: true,
  imports: [MonthCalendarComponent, HourGridComponent, LoadErrorComponent],
  providers: [AvailabilityStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:beforeunload)': 'onBeforeUnload($event)',
    '[class.has-save-bar]': 'store.changeCount() > 0',
  },
  template: `
    <header class="availability__header">
      <h1 class="section-title availability__title">Your availability</h1>
      <p class="availability__intro">
        Open the hours you're free. Clients can book any hour you leave open.
      </p>
    </header>

    @if (store.slots.hasValue()) {
      <div class="availability__layout">
        <section class="card availability__calendar" aria-label="Choose a day">
          <app-month-calendar
            [(month)]="month"
            [(selected)]="selectedDay"
            [today]="store.window.first"
            [min]="store.window.first"
            [max]="store.window.last"
            [summaries]="store.summaries()"
          />
          <p class="availability__note">
            Shaded days have open hours; a dot means a session is booked. You can open hours up to
            {{ windowDays }} days ahead.
          </p>
          @if (store.nothingOpenThisWeek()) {
            <p class="availability__nudge" role="status">
              No open hours in the next 7 days — clients can't book you yet.
            </p>
          }
        </section>

        <section class="availability__day" aria-labelledby="day-heading">
          <div class="availability__day-header">
            <div>
              <h2 class="availability__day-title" id="day-heading">{{ dayLabel() }}</h2>
              <p class="availability__day-meta">{{ dayMeta() }}</p>
            </div>
            <div class="availability__bulk">
              <button type="button" class="btn btn-outline btn-sm"
                      [disabled]="!canOpenAll()" (click)="store.setDay(selectedDay(), true)">
                Open all
              </button>
              <button type="button" class="btn btn-outline btn-sm"
                      [disabled]="!canCloseAll()" (click)="store.setDay(selectedDay(), false)">
                Close all
              </button>
            </div>
          </div>

          <p class="availability__hint">
            Tap an hour to open or close it. Hours with a session assigned to you are locked.
          </p>

          <app-hour-grid
            [hours]="hours()"
            [label]="'Hours on ' + dayLabel()"
            (toggle)="store.toggle($event)"
          />

          <ul class="legend" aria-label="Key">
            <li><span class="legend__swatch" data-state="open"></span>Open — clients can book</li>
            <li><span class="legend__swatch" data-state="closed"></span>Closed</li>
            <li><span class="legend__swatch" data-state="booked"></span>Booked — locked</li>
          </ul>

          <p class="availability__session-note">
            <strong>Each hour is one session:</strong> 5 min settling in, 55 min session.
            Another therapist may have the same hour open — that doesn't affect you. You'll only
            see <em>Booked</em> once a session is assigned to you.
          </p>
        </section>
      </div>
    } @else if (store.slots.error()) {
      <app-load-error
        message="We couldn't load your availability."
        (retry)="store.slots.reload()"
      />
    } @else {
      <div class="availability__layout" aria-busy="true">
        <span class="visually-hidden">Loading your availability…</span>
        <div class="skeleton skeleton--calendar" aria-hidden="true"></div>
        <div class="skeleton skeleton--hours" aria-hidden="true"></div>
      </div>
    }

    <!-- Always present so screen readers announce the outcome of a save. -->
    <div class="availability__live" role="status" aria-live="polite">
      @if (store.justSaved()) {
        <p class="toast">Saved. Your open hours are live.</p>
      }
    </div>

    @if (store.changeCount() > 0) {
      <div class="save-bar" role="region" aria-label="Unsaved changes">
        <div class="container save-bar__inner">
          <p class="save-bar__text">
            @if (store.saveError() === 'conflict') {
              Some hours were booked while you were editing — they're now locked. Review and save again.
            } @else if (store.saveError()) {
              We couldn't save. Your changes are still here — please try again.
            } @else {
              {{ changeSummary() }}
            }
          </p>
          <div class="save-bar__actions">
            <button type="button" class="btn btn-ghost" [disabled]="store.saving()" (click)="store.discard()">
              Discard
            </button>
            <button type="button" class="btn btn-primary" [disabled]="store.saving()" (click)="store.save()">
              {{ store.saving() ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      padding-top: var(--space-2xl);
    }

    /* Room for the fixed save bar, so it never covers the last row. */
    :host(.has-save-bar) { padding-bottom: 6rem; }

    .availability__header { margin-bottom: var(--space-xl); }
    .availability__title { margin-bottom: var(--space-xs); }
    .availability__intro { color: var(--color-text-muted); }

    .availability__layout {
      display: grid;
      grid-template-columns: minmax(280px, 2fr) minmax(0, 3fr);
      align-items: start;
      gap: var(--space-xl);
      padding-bottom: var(--space-2xl);

      @media (max-width: 860px) { grid-template-columns: 1fr; }
    }

    .card {
      padding: var(--space-lg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
    }

    .availability__note {
      margin-top: var(--space-md);
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .availability__nudge {
      margin-top: var(--space-sm);
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--color-crisis-border);
      border-radius: var(--radius-md);
      background-color: var(--color-crisis-bg);
      font-size: 0.875rem;
      color: var(--color-crisis);
    }

    .availability__day-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-md);
      margin-bottom: var(--space-sm);
    }

    .availability__day-title {
      font-family: var(--font-serif);
      font-size: 1.5rem;
      font-weight: normal;
    }

    .availability__day-meta {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .availability__bulk { display: flex; gap: var(--space-sm); }

    .availability__hint {
      margin-bottom: var(--space-md);
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xs) var(--space-lg);
      margin-top: var(--space-md);
      font-size: 0.8125rem;
      color: var(--color-text-muted);

      li { display: inline-flex; align-items: center; gap: var(--space-xs); }
    }

    .legend__swatch {
      width: 14px;
      height: 14px;
      border: 1.5px solid var(--color-border);
      border-radius: 4px;

      &[data-state='open'] { border-color: var(--color-open-border); background-color: var(--color-green-light); }
      &[data-state='booked'] { border-color: var(--color-booked-border); background-color: var(--color-booked-bg); }
    }

    .availability__session-note {
      margin-top: var(--space-lg);
      padding: var(--space-md);
      border-radius: var(--radius-md);
      background-color: var(--color-surface-muted);
      font-size: 0.875rem;
      color: var(--color-text-body);
    }


    .skeleton--calendar { min-height: 380px; }
    .skeleton--hours { min-height: 300px; }

    .toast {
      position: fixed;
      bottom: var(--space-lg);
      left: 50%;
      z-index: 120;
      transform: translateX(-50%);
      padding: 0.75rem 1.25rem;
      border-radius: var(--radius-pill);
      background-color: var(--color-green);
      box-shadow: var(--shadow-md);
      font-size: 0.9375rem;
      color: var(--color-green-text);
      white-space: nowrap;
    }

    /* Stays in view at the bottom while there is anything to save. */
    .save-bar {
      position: fixed;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 110;
      border-top: 1px solid var(--color-border);
      background-color: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(8px);
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
    }

    .save-bar__inner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-sm) var(--space-md);
      padding-block: var(--space-md);
    }

    .save-bar__text {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .save-bar__actions { display: flex; gap: var(--space-sm); }
  `,
})
export class AvailabilityPageComponent implements HasUnsavedChanges {
  protected readonly store = inject(AvailabilityStore);
  protected readonly windowDays = BOOKING_WINDOW_DAYS;

  protected readonly selectedDay = signal<CivilDate>(portalToday(new Date()));
  protected readonly month = signal<CivilDate>(startOfMonth(this.selectedDay()));

  protected readonly dayLabel = computed(() => formatDayLong(startOf(this.selectedDay())));

  protected readonly hours = computed<HourView[]>(() =>
    hourStarts(this.selectedDay()).map((start) => {
      const status = this.store.statusOf(start);
      const state: HourState =
        status === 'booked' ? 'booked' : this.store.isEditable(start) ? status : 'past';
      const time = formatTime(start);
      return {
        key: slotKey(start),
        start,
        time,
        range: `${time} to ${formatTime(new Date(start.getTime() + HOUR_MS))}`,
        state,
        changed: this.store.isChanged(start) && state !== 'past',
      };
    }),
  );

  protected readonly dayMeta = computed(() => {
    const hours = this.hours();
    const open = hours.filter((h) => h.state === 'open').length;
    const booked = hours.filter((h) => h.state === 'booked').length;
    const first = String(FIRST_HOUR).padStart(2, '0');
    return `${first}:00 to midnight · ${open} open · ${booked} booked`;
  });

  protected readonly canOpenAll = computed(() => this.hours().some((h) => h.state === 'closed'));
  protected readonly canCloseAll = computed(() => this.hours().some((h) => h.state === 'open'));

  protected readonly changeSummary = computed(() => {
    const changes = plural(this.store.changeCount(), 'unsaved change');
    const days = this.store.changedDayCount();
    return days > 1 ? `${changes} across ${days} days` : changes;
  });

  hasUnsavedChanges(): boolean {
    return this.store.changeCount() > 0;
  }

  /** Browser-level warning when closing or reloading the tab with unsaved edits. */
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }
}

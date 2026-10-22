import { ChangeDetectionStrategy, Component, computed, effect, input, model, signal, untracked } from '@angular/core';
import {
  CivilDate,
  addMonths,
  dayOfMonth,
  isSameMonth,
  monthWeeks,
  portalToday,
  startOf,
  startOfMonth,
} from '../../core/time/civil-date';
import { PORTAL_TIME_ZONE, formatLongDate, portalDay } from '../../core/time/portal-time';

/** An hour that can be booked. */
export interface PickableHour {
  readonly start: Date;
}

interface CalendarDay {
  readonly date: CivilDate;
  readonly inMonth: boolean;
  readonly isToday: boolean;
  /** Has at least one bookable hour. */
  readonly free: boolean;
}

const DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: PORTAL_TIME_ZONE });
const shortDayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: PORTAL_TIME_ZONE });
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: PORTAL_TIME_ZONE });

@Component({
  selector: 'app-calendar-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cal" role="group" aria-label="Pick a date and time">
      <div class="cal__layout">
        <div class="cal__left">
          <div class="cal__header">
            <button type="button" class="cal__nav-btn" (click)="moveMonth(-1)" [disabled]="!canGoBack()" aria-label="Previous month">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="cal__month-label" aria-live="polite">{{ monthLabel() }}</span>
            <button type="button" class="cal__nav-btn" (click)="moveMonth(1)" [disabled]="!canGoForward()" aria-label="Next month">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div class="cal__grid cal__grid--header" aria-hidden="true">
            @for (d of dayNames; track d) {
              <span class="cal__dow">{{ d }}</span>
            }
          </div>

          <div class="cal__grid">
            @for (day of days(); track day.date) {
              <button
                type="button"
                class="cal__day"
                [class.cal__day--other]="!day.inMonth"
                [class.cal__day--today]="day.isToday"
                [class.cal__day--past]="!day.free && day.inMonth"
                [class.cal__day--free]="day.free && day.inMonth"
                [class.cal__day--selected]="day.date === shownDay()"
                [disabled]="!day.free || !day.inMonth"
                [attr.aria-label]="describeDay(day)"
                [attr.aria-pressed]="day.date === shownDay()"
                [attr.aria-current]="day.isToday ? 'date' : null"
                (click)="showDay(day.date)"
              >{{ dayNumber(day.date) }}</button>
            }
          </div>
        </div>

        <div class="cal__right">
          @if (dayHours().length) {
            <p class="cal__times-label"><strong>{{ shownDayLabel() }}</strong></p>
            <div class="cal__times-list" role="group" aria-label="Free times">
              @for (hour of dayHours(); track hour.start.getTime()) {
                <button
                  type="button"
                  class="cal__slot"
                  [class.cal__slot--selected]="hour.start.getTime() === selected()?.getTime()"
                  [attr.aria-pressed]="hour.start.getTime() === selected()?.getTime()"
                  (click)="selected.set(hour.start)"
                >{{ time(hour.start) }}</button>
              }
            </div>
          } @else {
            <div class="cal__empty" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                   stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p>Select a date<br>to see times</p>
            </div>
          }
        </div>
      </div>

      @if (selected(); as chosen) {
        <div class="cal__summary" role="status" aria-live="polite">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          {{ summary(chosen) }}
        </div>
      }
    </div>
  `,
  styles: `
    /* ── Root ─────────────────────────────────── */
    .cal {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* ── Two-column layout ────────────────────── */
    .cal__layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 11rem;
      gap: 0;
      align-items: start;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;

      @media (max-width: 520px) {
        grid-template-columns: 1fr;
      }
    }

    /* ── LEFT ─────────────────────────────────── */
    .cal__left {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      padding: 1rem;
    }

    .cal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    .cal__month-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .cal__nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px; height: 26px;
      border: 1px solid var(--color-border);
      border-radius: 50%;
      background: var(--color-surface);
      color: var(--color-text-muted);
      cursor: pointer;
      transition: background-color 150ms ease, color 150ms ease,
                  border-color 150ms ease;

      &:hover:not(:disabled) {
        background-color: var(--color-green-light);
        color: var(--color-green);
        border-color: var(--color-green-light);
      }

      &:disabled { opacity: 0.35; cursor: not-allowed; }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 2px;
      }
    }

    .cal__grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      justify-items: center;
    }

    .cal__grid--header { margin-bottom: 0; }

    .cal__dow {
      font-size: 0.625rem;
      font-weight: 600;
      color: var(--color-text-subtle);
      padding-block: 0.25rem;
      text-align: center;
    }

    .cal__day {
      aspect-ratio: 1;
      max-width: 34px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      font-size: 0.8125rem;
      font-family: var(--font-sans);
      color: var(--color-text-body);
      cursor: pointer;
      transition: background-color 150ms ease, color 150ms ease;

      &:hover:not(:disabled):not(.cal__day--selected) {
        background-color: var(--color-green-light);
        color: var(--color-green);
      }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 1px;
      }

      &:disabled { cursor: default; }
    }

    .cal__day--other   { color: var(--color-text-subtle); opacity: 0.3; }
    .cal__day--today:not(.cal__day--selected) { font-weight: 700; color: var(--color-green); }
    .cal__day--past    { color: var(--color-text-subtle); opacity: 0.3; }
    .cal__day--free:not(.cal__day--selected) {
      font-weight: 600;
      color: var(--color-green);
      background-color: var(--color-green-light);
    }
    .cal__day--selected {
      background-color: var(--color-green) !important;
      color: var(--color-text-inverse) !important;
      font-weight: 600;
    }

    /* ── RIGHT ────────────────────────────────── */
    .cal__right {
      border-left: 1px solid var(--color-border);
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      /* match height of left column */
      align-self: stretch;

      @media (max-width: 520px) {
        border-left: none;
        border-top: 1px solid var(--color-border);
        align-self: auto;
      }
    }

    .cal__times-label {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;

      strong {
        display: block;
        font-size: 0.8125rem;
        text-transform: none;
        letter-spacing: 0;
        color: var(--color-text);
        font-weight: 600;
        margin-bottom: 0.5rem;
      }
    }

    /* Scrollable single-column slot list */
    .cal__times-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.3rem;
      max-height: 280px;

      @media (max-width: 520px) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-height: none;
      }
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--color-border) transparent;
      padding-right: 2px;
    }

    .cal__slot {
      padding: 0.4rem 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      font-size: 0.8125rem;
      font-family: var(--font-sans);
      color: var(--color-text);
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      transition: background-color 150ms ease, color 150ms ease,
                  border-color 150ms ease;

      &:hover:not(.cal__slot--selected) {
        background-color: var(--color-green-light);
        color: var(--color-green);
        border-color: var(--color-green-light);
      }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 2px;
      }
    }

    .cal__slot--selected {
      background-color: var(--color-green) !important;
      color: var(--color-text-inverse) !important;
      border-color: var(--color-green) !important;
      font-weight: 600;
    }

    /* Empty state */
    .cal__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      flex: 1;
      min-height: 120px;
      color: var(--color-text-subtle);
      text-align: center;
      font-size: 0.75rem;
      line-height: 1.5;
    }

    /* ── Summary chip ─────────────────────────── */
    .cal__summary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--color-green-light);
      color: var(--color-green);
      font-size: 0.8125rem;
      font-weight: 500;
      border-radius: var(--radius-pill);
      padding: 0.375rem 0.75rem;
      align-self: flex-start;
    }
  `,
})
export class CalendarPickerComponent {
  /** Every bookable hour, in order. */
  readonly hours = input.required<readonly PickableHour[]>();
  readonly selected = model<Date | null>(null);

  protected readonly dayNames = DAY_NAMES;
  private readonly today = portalToday(new Date());

  /** Hours grouped by their day in India. */
  private readonly byDay = computed(() => {
    const groups = new Map<CivilDate, PickableHour[]>();
    for (const hour of this.hours()) {
      const day = portalDay(hour.start);
      groups.set(day, [...(groups.get(day) ?? []), hour]);
    }
    return groups;
  });

  private readonly firstMonth = computed(() => startOfMonth(portalDay(this.hours()[0]?.start ?? new Date())));
  private readonly lastMonth = computed(() => startOfMonth(portalDay(this.hours().at(-1)?.start ?? new Date())));

  private readonly cursor = signal<CivilDate>(startOfMonth(this.today));
  private readonly chosenDay = signal<CivilDate | null>(null);

  /** The day whose hours are listed: the one picked, if it still has any. */
  protected readonly shownDay = computed(() => {
    const chosen = this.chosenDay();
    return chosen && this.byDay().has(chosen) ? chosen : null;
  });
  protected readonly dayHours = computed(() => this.byDay().get(this.shownDay() ?? '') ?? []);
  protected readonly shownDayLabel = computed(() => {
    const first = this.dayHours()[0];
    return first ? shortDayFormat.format(first.start) : '';
  });

  protected readonly monthLabel = computed(() => monthFormat.format(startOf(this.cursor())));
  protected readonly canGoBack = computed(() => this.cursor() > this.firstMonth());
  protected readonly canGoForward = computed(() => this.cursor() < this.lastMonth());

  protected readonly days = computed<CalendarDay[]>(() =>
    monthWeeks(this.cursor())
      .flat()
      .map((date) => ({
        date,
        inMonth: isSameMonth(date, this.cursor()),
        isToday: date === this.today,
        free: this.byDay().has(date),
      })),
  );

  constructor() {
    // New hours (e.g. other languages): open the first month that has any, and drop a choice that's gone.
    effect(() => {
      const hours = this.hours();
      const firstMonth = this.firstMonth();
      untracked(() => {
        this.cursor.set(firstMonth);
        const chosen = this.selected();
        if (chosen && !hours.some((h) => h.start.getTime() === chosen.getTime())) this.selected.set(null);
      });
    });
  }

  protected moveMonth(step: number): void {
    this.cursor.set(addMonths(this.cursor(), step));
  }

  protected showDay(date: CivilDate): void {
    this.chosenDay.set(date);
    const chosen = this.selected();
    if (chosen && portalDay(chosen) !== date) this.selected.set(null);
  }

  protected dayNumber(date: CivilDate): number {
    return dayOfMonth(date);
  }

  protected describeDay(day: CalendarDay): string {
    return `${formatLongDate(startOf(day.date))}${day.free ? '' : ', no free times'}`;
  }

  protected time(date: Date): string {
    return timeFormat.format(date);
  }

  protected summary(date: Date): string {
    return `${formatLongDate(date)} at ${timeFormat.format(date)} IST`;
  }
}

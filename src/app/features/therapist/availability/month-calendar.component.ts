import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import {
  CivilDate,
  addDays,
  addMonths,
  dayOfMonth,
  isSameMonth,
  monthWeeks,
  startOf,
  startOfMonth,
  weekdayIndex,
} from '../civil-date';
import { formatDayLong, formatLongMonthYear } from '../portal-time';
import { DaySummary } from './availability.store';

interface CalendarCell {
  readonly date: CivilDate;
  readonly day: number;
  readonly inMonth: boolean;
  readonly enabled: boolean;
  readonly selected: boolean;
  readonly today: boolean;
  readonly open: boolean;
  readonly booked: boolean;
  readonly changed: boolean;
  readonly label: string;
}

const WEEKDAYS = [
  { short: 'M', long: 'Monday' },
  { short: 'T', long: 'Tuesday' },
  { short: 'W', long: 'Wednesday' },
  { short: 'T', long: 'Thursday' },
  { short: 'F', long: 'Friday' },
  { short: 'S', long: 'Saturday' },
  { short: 'S', long: 'Sunday' },
];

/** Moves for the arrow / Home / End / Page keys (WAI-ARIA date grid). */
const KEY_MOVES: Readonly<Partial<Record<string, (date: CivilDate) => CivilDate>>> = {
  ArrowLeft: (d) => addDays(d, -1),
  ArrowRight: (d) => addDays(d, 1),
  ArrowUp: (d) => addDays(d, -7),
  ArrowDown: (d) => addDays(d, 7),
  Home: (d) => addDays(d, -weekdayIndex(d)),
  End: (d) => addDays(d, 6 - weekdayIndex(d)),
  PageUp: (d) => addMonths(d, -1),
  PageDown: (d) => addMonths(d, 1),
};

/**
 * Month view for picking a day. Shaded days have open hours, a dot marks
 * days with bookings, and a ring marks days with unsaved changes. Only days
 * between `min` and `max` can be picked.
 */
@Component({
  selector: 'app-month-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cal__header">
      <h2 class="cal__title" id="cal-title" aria-live="polite">{{ monthLabel() }}</h2>
      <div class="cal__nav">
        <button type="button" class="cal__nav-btn" aria-label="Previous month"
                [disabled]="!canGoBack()" (click)="shiftMonth(-1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <button type="button" class="cal__nav-btn" aria-label="Next month"
                [disabled]="!canGoForward()" (click)="shiftMonth(1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>

    <table class="cal__grid" role="grid" aria-labelledby="cal-title">
      <thead>
        <tr>
          @for (weekday of weekdays; track $index) {
            <th scope="col" [attr.abbr]="weekday.long">{{ weekday.short }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (week of weeks(); track week[0].date) {
          <tr>
            @for (cell of week; track cell.date) {
              <td role="gridcell" [attr.aria-selected]="cell.inMonth ? cell.selected : null">
                @if (cell.inMonth) {
                  <button
                    type="button"
                    class="cal__day"
                    [attr.data-date]="cell.date"
                    [class.cal__day--open]="cell.open"
                    [class.cal__day--selected]="cell.selected"
                    [class.cal__day--today]="cell.today"
                    [class.cal__day--changed]="cell.changed"
                    [disabled]="!cell.enabled"
                    [tabIndex]="cell.selected ? 0 : -1"
                    [attr.aria-label]="cell.label"
                    [attr.aria-current]="cell.today ? 'date' : null"
                    (click)="select(cell.date)"
                    (keydown)="onKeydown($event, cell.date)"
                  >
                    {{ cell.day }}
                    @if (cell.booked) {
                      <span class="cal__dot" aria-hidden="true"></span>
                    }
                  </button>
                }
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    :host { display: block; }

    .cal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-md);
    }

    .cal__title {
      font-family: var(--font-sans);
      font-size: 1rem;
      font-weight: 700;
    }

    .cal__nav { display: flex; gap: var(--space-xs); }

    .cal__nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text);
      cursor: pointer;

      &:hover:not(:disabled) { background-color: rgba(0, 0, 0, 0.04); }
      &:disabled { color: var(--color-text-subtle); cursor: not-allowed; }
      &:focus-visible { outline: 2px solid var(--color-green); outline-offset: 1px; }
    }

    .cal__grid {
      width: 100%;
      border-collapse: separate;
      border-spacing: 4px;
      table-layout: fixed;
    }

    th {
      padding-bottom: var(--space-xs);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    td { padding: 0; }

    .cal__day {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      aspect-ratio: 1 / 0.85;
      min-height: 40px;
      border: 1.5px solid transparent;
      border-radius: var(--radius-md);
      background: transparent;
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      font-variant-numeric: tabular-nums;
      color: var(--color-text);
      cursor: pointer;
      transition: background-color var(--transition), border-color var(--transition);

      &:hover:not(:disabled) { border-color: var(--color-border); }

      &:disabled {
        color: var(--color-text-subtle);
        cursor: default;
      }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 2px;
      }
    }

    .cal__day--open {
      background-color: var(--color-green-light);
      font-weight: 600;
    }

    .cal__day--today { border-color: var(--color-green); }

    .cal__day--changed::after {
      content: '';
      position: absolute;
      top: 4px;
      right: 4px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--color-crisis);
    }

    .cal__day--selected {
      background-color: var(--color-green);
      border-color: var(--color-green);
      color: var(--color-green-text);
      font-weight: 700;
    }

    .cal__dot {
      position: absolute;
      bottom: 5px;
      left: 50%;
      width: 4px;
      height: 4px;
      margin-left: -2px;
      border-radius: 50%;
      background-color: var(--color-booked-dot);

      .cal__day--selected > & { background-color: var(--color-green-text); }
    }
  `,
})
export class MonthCalendarComponent {
  /** Any date in the month on display. */
  readonly month = model.required<CivilDate>();
  readonly selected = model.required<CivilDate>();
  readonly today = input.required<CivilDate>();
  readonly min = input.required<CivilDate>();
  readonly max = input.required<CivilDate>();
  readonly summaries = input.required<ReadonlyMap<CivilDate, DaySummary>>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly weekdays = WEEKDAYS;
  protected readonly monthLabel = computed(() => formatLongMonthYear(startOf(this.month())));
  protected readonly canGoBack = computed(() => startOfMonth(this.month()) > startOfMonth(this.min()));
  protected readonly canGoForward = computed(() => startOfMonth(this.month()) < startOfMonth(this.max()));

  protected readonly weeks = computed<CalendarCell[][]>(() =>
    monthWeeks(this.month()).map((week) => week.map((date) => this.toCell(date))),
  );

  protected select(date: CivilDate): void {
    if (this.isEnabled(date)) this.selected.set(date);
  }

  protected shiftMonth(step: number): void {
    this.month.set(addMonths(this.month(), step));
  }

  protected onKeydown(event: KeyboardEvent, from: CivilDate): void {
    const move = KEY_MOVES[event.key];
    if (!move) return;
    event.preventDefault();

    const target = this.clamp(move(from));
    this.selected.set(target);
    if (!isSameMonth(target, this.month())) this.month.set(startOfMonth(target));
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLButtonElement>(`[data-date="${target}"]`)?.focus(),
      { injector: this.injector },
    );
  }

  private toCell(date: CivilDate): CalendarCell {
    const summary = this.summaries().get(date);
    const enabled = this.isEnabled(date);
    const details = [
      summary?.open ? `${summary.open} open` : enabled ? 'no open hours' : 'unavailable',
      summary?.booked ? `${summary.booked} booked` : null,
      summary?.changed ? 'unsaved changes' : null,
    ].filter(Boolean);

    return {
      date,
      day: dayOfMonth(date),
      inMonth: isSameMonth(date, this.month()),
      enabled,
      selected: date === this.selected(),
      today: date === this.today(),
      open: !!summary?.open,
      booked: !!summary?.booked,
      changed: !!summary?.changed,
      label: `${formatDayLong(startOf(date))}, ${details.join(', ')}`,
    };
  }

  private isEnabled(date: CivilDate): boolean {
    return date >= this.min() && date <= this.max();
  }

  private clamp(date: CivilDate): CivilDate {
    if (date < this.min()) return this.min();
    if (date > this.max()) return this.max();
    return date;
  }
}

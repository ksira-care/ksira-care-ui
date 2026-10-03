import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';

export interface CalendarSelection {
  date: Date;
  time: string; // "HH:MM"
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
];

const DAY_NAMES   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

@Component({
  selector: 'app-calendar-picker',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cal" role="group" aria-label="Pick a date and time">

      <div class="cal__layout">

        <!-- ── LEFT: Month grid ── -->
        <div class="cal__left">
          <div class="cal__header">
            <button type="button" class="cal__nav-btn"
              (click)="prevMonth()" [disabled]="isPrevDisabled()"
              aria-label="Previous month">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            <span class="cal__month-label" aria-live="polite">
              {{ monthLabel() }}
            </span>

            <button type="button" class="cal__nav-btn"
              (click)="nextMonth()" aria-label="Next month">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <div class="cal__grid cal__grid--header" aria-hidden="true">
            @for (d of dayNames; track d) {
              <span class="cal__dow">{{ d }}</span>
            }
          </div>

          <div class="cal__grid" role="grid" [attr.aria-label]="monthLabel()">
            @for (day of days(); track day.date.toISOString()) {
              <button
                type="button" role="gridcell" class="cal__day"
                [class.cal__day--other]="!day.inMonth"
                [class.cal__day--today]="day.isToday"
                [class.cal__day--past]="day.isPast"
                [class.cal__day--selected]="isSelected(day.date)"
                [disabled]="day.isPast || !day.inMonth"
                [attr.aria-label]="day.date | date:'EEEE, MMMM d, y'"
                [attr.aria-pressed]="isSelected(day.date)"
                [attr.aria-current]="day.isToday ? 'date' : null"
                (click)="selectDate(day.date)"
              >{{ day.date.getDate() }}</button>
            }
          </div>
        </div>

        <!-- ── RIGHT: Time slots ── -->
        <div class="cal__right">
          @if (selectedDate()) {
            <p class="cal__times-label">
              <strong>{{ selectedDate()! | date:'EEE, MMM d' }}</strong>
            </p>
            <div class="cal__times-list" role="group" aria-label="Available time slots">
              @for (slot of timeSlots; track slot) {
                <button type="button" class="cal__slot"
                  [class.cal__slot--selected]="selectedTime() === slot"
                  [attr.aria-pressed]="selectedTime() === slot"
                  (click)="selectTime(slot)">
                  {{ formatTime(slot) }}
                </button>
              }
            </div>
          } @else {
            <div class="cal__empty" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <p>Select a date<br>to see times</p>
            </div>
          }
        </div>

      </div>

      <!-- Summary chip -->
      @if (selectedDate() && selectedTime()) {
        <div class="cal__summary" role="status" aria-live="polite">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ selectedDate()! | date:'EEEE, MMMM d' }} at {{ formatTime(selectedTime()!) }}
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
      grid-template-columns: 1fr 148px;
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
    .cal__day--selected {
      background-color: var(--color-green) !important;
      color: #fff !important;
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
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      max-height: 240px;
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
      font-size: 0.75rem;
      font-family: var(--font-sans);
      color: var(--color-text-muted);
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
      color: #fff !important;
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
  @Output() readonly selectionChange = new EventEmitter<CalendarSelection | null>();

  protected readonly dayNames  = DAY_NAMES;
  protected readonly timeSlots = TIME_SLOTS;

  private readonly today  = new Date();
  private readonly cursor = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));

  protected readonly selectedDate = signal<Date | null>(null);
  protected readonly selectedTime = signal<string | null>(null);

  protected readonly monthLabel = computed(() =>
    `${MONTH_NAMES[this.cursor().getMonth()]} ${this.cursor().getFullYear()}`
  );

  protected readonly isPrevDisabled = computed(() => {
    const c = this.cursor();
    return c.getFullYear() === this.today.getFullYear() &&
           c.getMonth()    === this.today.getMonth();
  });

  protected readonly days = computed<CalendarDay[]>(() => {
    const year  = this.cursor().getFullYear();
    const month = this.cursor().getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const todayMidnight = new Date(
      this.today.getFullYear(), this.today.getMonth(), this.today.getDate()
    );

    const cells: CalendarDay[] = [];

    // Pad start
    for (let i = 0; i < first.getDay(); i++) {
      const d = new Date(year, month, -first.getDay() + i + 1);
      cells.push({ date: d, inMonth: false, isToday: false, isPast: true });
    }

    // Current month
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, month, d);
      cells.push({
        date,
        inMonth: true,
        isToday: isSameDay(date, this.today),
        isPast:  date < todayMidnight,
      });
    }

    // Pad end
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells.push({ date: new Date(year, month + 1, i), inMonth: false, isToday: false, isPast: false });
    }

    return cells;
  });

  protected prevMonth(): void {
    const c = this.cursor();
    this.cursor.set(new Date(c.getFullYear(), c.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const c = this.cursor();
    this.cursor.set(new Date(c.getFullYear(), c.getMonth() + 1, 1));
  }

  protected selectDate(date: Date): void {
    this.selectedDate.set(date);
    this.selectedTime.set(null);
    this.emit();
  }

  protected selectTime(slot: string): void {
    this.selectedTime.set(slot);
    this.emit();
  }

  protected isSelected(date: Date): boolean {
    const sel = this.selectedDate();
    return !!sel && isSameDay(sel, date);
  }

  protected formatTime(slot: string): string {
    const [hStr, mStr] = slot.split(':');
    const h    = parseInt(hStr, 10);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12  = h % 12 || 12;
    return `${h12}:${mStr} ${ampm}`;
  }

  private emit(): void {
    const date = this.selectedDate();
    const time = this.selectedTime();
    this.selectionChange.emit(date && time ? { date, time } : null);
  }
}

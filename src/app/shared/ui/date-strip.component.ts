import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { CivilDate, addDays, startOf } from '../../core/time/civil-date';
import { PORTAL_TIME_ZONE } from '../../core/time/portal-time';

/** How many days the strip shows, centred on the chosen one. */
const VISIBLE_DAYS = 5;

const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: PORTAL_TIME_ZONE });
const dayNumber = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: PORTAL_TIME_ZONE });

/**
 * Moves between days: arrows step one day, the pills jump to nearby days,
 * and "Jump to a date" reaches any other. Bind `[(date)]`.
 */
@Component({
  selector: 'app-date-strip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="strip" role="group" [attr.aria-label]="label()">
      <button type="button" class="strip__step" aria-label="Previous day" (click)="date.set(step(-1))">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      @for (day of days(); track day.date) {
        <button
          type="button"
          class="strip__day"
          [attr.aria-pressed]="day.date === date()"
          [attr.aria-label]="day.accessibleLabel"
          (click)="date.set(day.date)"
        >{{ day.label }}</button>
      }
      <button type="button" class="strip__step" aria-label="Next day" (click)="date.set(step(1))">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
      <label class="strip__jump">
        <span>Jump to a date</span>
        <input type="date" class="form-control strip__picker" [value]="date()" (change)="jump($event)" />
      </label>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
    }

    .strip {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-sm);
    }

    .strip__step,
    .strip__day {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-pill);
      background-color: var(--color-surface);
      font-family: var(--font-sans);
      font-size: 0.875rem;
      color: var(--color-text);
      cursor: pointer;
      transition: border-color var(--transition), background-color var(--transition);

      &:hover { border-color: var(--color-green); }
      &:focus-visible { outline: 2px solid var(--color-green); outline-offset: 2px; }
    }

    .strip__step { width: 40px; }
    .strip__day { padding: 0 0.875rem; white-space: nowrap; }

    .strip__day[aria-pressed='true'] {
      border-color: var(--color-green);
      background-color: var(--color-green);
      color: var(--color-green-text);
      font-weight: 600;
    }

    .strip__jump {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      margin-left: var(--space-sm);
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .strip__picker {
      width: auto;
      padding-block: 0.375rem;
      font-size: 0.875rem;
    }
  `,
})
export class DateStripComponent {
  readonly date = model.required<CivilDate>();
  /** Today in the portal time zone; today and tomorrow are labelled by name. */
  readonly today = input.required<CivilDate>();
  readonly label = input('Choose a day');

  protected readonly days = computed(() => {
    const first = addDays(this.date(), -Math.floor(VISIBLE_DAYS / 2));
    return Array.from({ length: VISIBLE_DAYS }, (_, i) => {
      const date = addDays(first, i);
      const start = startOf(date);
      const label =
        date === this.today() ? 'Today'
        : date === addDays(this.today(), 1) ? 'Tomorrow'
        : `${weekday.format(start)} ${dayNumber.format(start)}`;
      return { date, label, accessibleLabel: start.toLocaleDateString('en-GB', { dateStyle: 'full', timeZone: PORTAL_TIME_ZONE }) };
    });
  });

  protected step(days: number): CivilDate {
    return addDays(this.date(), days);
  }

  protected jump(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) this.date.set(value);
  }
}

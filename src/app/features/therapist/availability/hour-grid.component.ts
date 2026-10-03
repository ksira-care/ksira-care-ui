import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type HourState = 'open' | 'closed' | 'booked' | 'past';

export interface HourView {
  readonly key: number;
  readonly start: Date;
  /** "09:00" */
  readonly time: string;
  /** "09:00 to 10:00" — for screen readers. */
  readonly range: string;
  readonly state: HourState;
  /** Differs from what's saved. */
  readonly changed: boolean;
}

/**
 * The hours of one day as toggle buttons. Open/closed hours toggle
 * (aria-pressed = open); booked and past hours are shown but locked.
 */
@Component({
  selector: 'app-hour-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hours" role="group" [attr.aria-label]="label()">
      @for (hour of hours(); track hour.key) {
        @switch (hour.state) {
          @case ('booked') {
            <div class="hour" data-state="booked">
              {{ hour.time }}<span class="hour__tag">Booked</span>
              <span class="visually-hidden">— {{ hour.range }} has a session assigned to you</span>
            </div>
          }
          @case ('past') {
            <div class="hour" data-state="past">
              {{ hour.time }}<span class="visually-hidden">— {{ hour.range }} has passed</span>
            </div>
          }
          @default {
            <button
              type="button"
              class="hour"
              [attr.data-state]="hour.state"
              [class.hour--changed]="hour.changed"
              [attr.aria-pressed]="hour.state === 'open'"
              [attr.aria-label]="hour.range + (hour.changed ? ', unsaved' : '')"
              (click)="toggle.emit(hour.start)"
            >
              {{ hour.time }}
            </button>
          }
        }
      }
    </div>
  `,
  styles: `
    .hours {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
      gap: var(--space-sm);
    }

    .hour {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      min-height: 48px;
      padding: 0 var(--space-sm);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      background-color: var(--color-surface);
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      font-variant-numeric: tabular-nums;
      color: var(--color-text-muted);
      white-space: nowrap;
    }

    button.hour {
      cursor: pointer;
      transition: background-color var(--transition), border-color var(--transition);

      &:hover { border-color: var(--color-green); }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 2px;
      }
    }

    .hour[data-state='open'] {
      border-color: var(--color-open-border);
      background-color: var(--color-green-light);
      font-weight: 700;
      color: var(--color-green);
    }

    .hour[data-state='booked'] {
      border-color: var(--color-booked-border);
      background-color: var(--color-booked-bg);
      font-weight: 700;
      color: var(--color-booked);
    }

    .hour[data-state='past'] {
      border-style: dashed;
      background-color: transparent;
      color: var(--color-text-subtle);
    }

    .hour__tag {
      font-size: 0.75rem;
      font-weight: 600;
    }

    /* Unsaved: a small amber dot, matching the calendar. */
    .hour--changed::after {
      content: '';
      position: absolute;
      top: 6px;
      right: 6px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--color-crisis);
    }
  `,
})
export class HourGridComponent {
  readonly hours = input.required<readonly HourView[]>();
  /** Accessible name for the group, e.g. "Hours on Saturday, 3 October". */
  readonly label = input.required<string>();
  readonly toggle = output<Date>();
}

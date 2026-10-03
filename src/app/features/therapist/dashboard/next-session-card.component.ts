import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatLanguages, formatStartsIn, formatTimeRange } from '../bookings/booking-format';
import { isInProgress } from '../bookings/booking-rules';
import { Booking } from '../bookings/booking.models';
import { abbreviatedName } from '../person-name';

/**
 * The one thing a therapist needs before a session: who, when, what the
 * client is hoping for, and in which language. Pass `null` when nothing is coming up.
 */
@Component({
  selector: 'app-next-session-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.next-session--live]': 'live()' },
  template: `
    <p class="next-session__eyebrow">{{ live() ? 'In session' : 'Next session' }}</p>

    @if (booking(); as booking) {
      <p class="next-session__when">
        <span class="next-session__starts">{{ startsIn() }}</span>
        <span class="next-session__range">{{ timeRange() }}</span>
      </p>
      <p class="next-session__client">{{ clientName() }}</p>
      @if (booking.reason) {
        <blockquote class="next-session__reason">“{{ booking.reason }}”</blockquote>
      }
      @if (languages()) {
        <p class="next-session__languages">
          <span class="visually-hidden">Preferred languages: </span>{{ languages() }}
        </p>
      }
    } @else {
      <p class="next-session__empty">Nothing booked in the next two weeks.</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
      padding: var(--space-lg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface-muted);
    }

    :host(.next-session--live) {
      border-color: var(--color-green);
      box-shadow: 0 0 0 1px var(--color-green);
    }

    .next-session__eyebrow {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--color-green);
    }

    .next-session__when {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0 var(--space-sm);
      margin-top: var(--space-xs);
    }

    .next-session__starts {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-text);
    }

    .next-session__range {
      font-size: 0.9375rem;
      color: var(--color-text-muted);
    }

    .next-session__client {
      margin-top: var(--space-sm);
      font-family: var(--font-serif);
      font-size: clamp(1.5rem, 3vw, 1.875rem);
      line-height: 1.2;
      color: var(--color-text);
    }

    .next-session__reason {
      margin: var(--space-xs) 0 0;
      font-size: 1rem;
      color: var(--color-text-body);
    }

    .next-session__languages {
      margin-top: var(--space-xs);
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .next-session__empty {
      margin-top: var(--space-sm);
      color: var(--color-text-muted);
    }
  `,
})
export class NextSessionCardComponent {
  readonly booking = input.required<Booking | null>();
  readonly now = input.required<Date>();

  protected readonly live = computed(() => {
    const booking = this.booking();
    return !!booking && isInProgress(booking, this.now());
  });

  protected readonly startsIn = computed(() => {
    const booking = this.booking();
    return booking ? formatStartsIn(booking, this.now()) : '';
  });

  protected readonly timeRange = computed(() => {
    const booking = this.booking();
    return booking ? formatTimeRange(booking) : '';
  });

  protected readonly clientName = computed(() => abbreviatedName(this.booking()?.clientName));
  protected readonly languages = computed(() => formatLanguages(this.booking()?.clientLanguages ?? []));
}

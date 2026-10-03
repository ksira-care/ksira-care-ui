import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { abbreviatedName } from '../person-name';
import {
  PORTAL_TIME_ZONE,
  formatDayLong,
  formatDayMonth,
  formatTime,
  formatWeekdayDayMonth,
} from '../portal-time';
import {
  STATUS_LABELS,
  displayStatus,
  formatEndedAgo,
  formatLanguages,
  formatStartsIn,
  formatTimeRange,
} from './booking-format';
import { canMark, canUndoMark } from './booking-rules';
import { Booking, TherapistSetStatus } from './booking.models';

const weekdayShort = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: PORTAL_TIME_ZONE });
const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: PORTAL_TIME_ZONE });
const dayNumber = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: PORTAL_TIME_ZONE });

/**
 * One session. In "to-mark" mode it offers Mark complete / Client didn't
 * join once the session has started; in "completed" mode it's read-only.
 */
@Component({
  selector: 'app-booking-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-status]': 'status()' },
  template: `
    <article class="booking" [attr.aria-labelledby]="headingId()">
      <div class="booking__date" aria-hidden="true">
        <span class="booking__weekday">{{ weekday() }}</span>
        <span class="booking__day">{{ day() }}</span>
        <span class="booking__month">{{ month() }}</span>
      </div>

      <div class="booking__body">
        <h3 class="booking__when" [id]="headingId()">
          <span class="visually-hidden">{{ fullDate() }}, </span>
          <span class="booking__time">{{ timeRange() }}</span>
          <span class="booking__relative">{{ relative() }}</span>
          @if (badge(); as badge) {
            <span class="badge" [attr.data-status]="status()">{{ badge }}</span>
          }
          @if (booking().rescheduledFrom) {
            <span class="badge" data-status="rescheduled">Rescheduled by admin</span>
          }
        </h3>

        <p class="booking__meta">{{ meta() }}</p>
        @if (rescheduleLine(); as line) {
          <p class="booking__meta booking__meta--reschedule">{{ line }}</p>
        }

        @if (booking().reason) {
          <p class="booking__label">What they expect</p>
          <blockquote class="booking__reason">“{{ booking().reason }}”</blockquote>
        }
      </div>

      @if (mode() === 'to-mark') {
        <div class="booking__actions">
          <!-- Buttons only once they can be used; before that, a quiet note says when. -->
          @if (markable()) {
            <button
              type="button"
              class="btn btn-primary booking__complete"
              [disabled]="busy()"
              (click)="mark.emit('completed')"
            >
              {{ busy() ? 'Saving…' : 'Mark complete' }}
            </button>
            <button
              type="button"
              class="btn btn-ghost booking__no-show"
              [disabled]="busy()"
              (click)="mark.emit('client-no-show')"
            >
              Client didn't join
            </button>
          }
          @if (failed()) {
            <p class="booking__hint booking__hint--error" role="alert">
              Couldn't update — please try again.
            </p>
          } @else if (hint(); as hint) {
            <p class="booking__hint">{{ hint }}</p>
          }
        </div>
      } @else if (undoable()) {
        <div class="booking__actions">
          <button type="button" class="btn btn-outline btn-sm booking__undo" [disabled]="busy()" (click)="undo.emit()">
            {{ busy() ? 'Saving…' : 'Undo' }}
          </button>
          @if (failed()) {
            <p class="booking__hint booking__hint--error" role="alert">
              Couldn't update — please try again.
            </p>
          } @else {
            <p class="booking__hint">You can undo this until midnight.</p>
          }
        </div>
      }
    </article>
  `,
  styles: `
    :host { display: block; }

    .booking {
      display: grid;
      grid-template-columns: 4.5rem minmax(0, 1fr) auto;
      gap: var(--space-lg);
      padding: var(--space-lg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);

      @media (max-width: 720px) {
        grid-template-columns: 3.5rem minmax(0, 1fr);
        gap: var(--space-md);
        padding: var(--space-md);
      }
    }

    :host([data-status='needs-marking']) .booking {
      border-color: var(--color-crisis-border);
      box-shadow: inset 4px 0 0 var(--color-crisis);
    }

    :host([data-status='in-progress']) .booking {
      border-color: var(--color-green);
      box-shadow: inset 4px 0 0 var(--color-green);
    }

    .booking__date {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-right: var(--space-md);
      border-right: 1px solid var(--color-border);
      color: var(--color-text);
      text-align: center;

      @media (max-width: 720px) { padding-right: var(--space-sm); }
    }

    .booking__weekday,
    .booking__month {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    .booking__day {
      font-family: var(--font-serif);
      font-size: 2rem;
      line-height: 1.15;
    }

    .booking__when {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-xs) var(--space-sm);
      font-family: var(--font-sans);
      font-size: 1.0625rem;
      font-weight: 400;
    }

    .booking__time {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .booking__relative {
      font-size: 0.9375rem;
      color: var(--color-text-muted);
    }

    .booking__meta {
      margin-top: var(--space-xs);
      font-size: 0.9375rem;
      color: var(--color-text-muted);
    }

    .booking__label {
      margin-top: var(--space-md);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    .booking__reason {
      margin: var(--space-xs) 0 0;
      font-style: italic;
      color: var(--color-text);
    }

    .booking__actions {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-xs);
      width: 13rem;

      @media (max-width: 720px) {
        grid-column: 1 / -1;
        flex-direction: row;
        flex-wrap: wrap;
        width: auto;
      }
    }

    .booking__complete { padding-block: 0.6rem; }

    .booking__no-show {
      justify-content: center;
      font-size: 0.875rem;

      @media (max-width: 720px) { padding-inline: var(--space-sm); }
    }

    .booking__hint {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      text-align: center;

      @media (max-width: 720px) {
        flex-basis: 100%;
        text-align: left;
      }
    }

    .booking__hint--error { color: var(--color-danger); }

    .badge {
      display: inline-block;
      padding: 0.15rem 0.6rem;
      border-radius: var(--radius-pill);
      font-size: 0.8125rem;
      font-weight: 600;
      white-space: nowrap;
      background-color: var(--color-surface-muted);
      color: var(--color-text-body);

      &[data-status='needs-marking'] {
        background-color: var(--color-crisis-bg);
        color: var(--color-crisis);
      }
      &[data-status='in-progress'] {
        background-color: var(--color-green);
        color: var(--color-green-text);
      }
      &[data-status='completed'] {
        background-color: var(--color-green-light);
        color: var(--color-green);
      }
      &[data-status='client-no-show'] {
        background-color: var(--color-danger-bg);
        color: var(--color-danger);
      }
      &[data-status='therapist-no-show'] {
        background-color: var(--color-crisis-bg);
        color: var(--color-crisis);
      }
      &[data-status='rescheduled'] {
        background-color: var(--color-info-bg);
        color: var(--color-info);
      }
    }
  `,
})
export class BookingCardComponent {
  readonly booking = input.required<Booking>();
  readonly now = input.required<Date>();
  readonly mode = input.required<'to-mark' | 'completed'>();
  readonly busy = input(false);
  readonly failed = input(false);
  readonly mark = output<Exclude<TherapistSetStatus, 'scheduled'>>();
  readonly undo = output<void>();

  protected readonly status = computed(() => displayStatus(this.booking(), this.now()));
  protected readonly markable = computed(() => canMark(this.booking(), this.now()));
  protected readonly undoable = computed(
    () => this.mode() === 'completed' && canUndoMark(this.booking(), this.now()),
  );
  protected readonly headingId = computed(() => `booking-${this.booking().id}`);

  protected readonly weekday = computed(() => weekdayShort.format(this.booking().start));
  protected readonly day = computed(() => dayNumber.format(this.booking().start));
  protected readonly month = computed(() => monthShort.format(this.booking().start));
  protected readonly fullDate = computed(() => formatDayLong(this.booking().start));
  protected readonly timeRange = computed(() => formatTimeRange(this.booking()));

  protected readonly relative = computed(() => {
    const status = this.status();
    if (status === 'scheduled') return `· ${formatStartsIn(this.booking(), this.now()).toLowerCase()}`;
    if (status === 'needs-marking') return `· ${formatEndedAgo(this.booking(), this.now()).toLowerCase()}`;
    return '';
  });

  /** Only states worth calling out; plain "scheduled" needs no badge. */
  protected readonly badge = computed(() => {
    const status = this.status();
    return status === 'scheduled' ? null : STATUS_LABELS[status];
  });

  protected readonly meta = computed(() => {
    const booking = this.booking();
    return [
      abbreviatedName(booking.clientName),
      formatLanguages(booking.clientLanguages) || null,
      booking.assignedAt ? `assigned by admin on ${formatDayMonth(booking.assignedAt)}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
  });

  protected readonly rescheduleLine = computed(() => {
    const { rescheduledFrom, rescheduleNote } = this.booking();
    if (!rescheduledFrom) return null;
    const moved = `Moved from ${formatWeekdayDayMonth(rescheduledFrom)}, ${formatTime(rescheduledFrom)}`;
    return rescheduleNote ? `${moved}. ${rescheduleNote}` : `${moved}.`;
  });

  protected readonly hint = computed(() => {
    switch (this.status()) {
      case 'scheduled':
        return `You can mark this from ${formatTime(this.booking().start)}.`;
      case 'needs-marking':
        return 'How did it go? Mark it so it’s counted.';
      default:
        return null;
    }
  });
}

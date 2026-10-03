import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DisplayStatus, STATUS_LABELS, displayStatus } from '../bookings/booking-format';
import { isUpcoming } from '../bookings/booking-rules';
import { Booking } from '../bookings/booking.models';
import { abbreviatedName } from '../person-name';
import { formatTime } from '../portal-time';
import { TherapistPaths } from '../therapist-paths';

type ItemState = 'done' | 'now' | 'upcoming';

interface TimelineItem {
  readonly id: string;
  readonly time: string;
  readonly client: string;
  readonly state: ItemState;
  /** Shown only when it adds information (e.g. "Client no-show", "Now"). */
  readonly note: string | null;
}

const NOTE_STATUSES: ReadonlySet<DisplayStatus> = new Set([
  'needs-marking',
  'client-no-show',
  'therapist-no-show',
  'unknown',
]);

/** Upcoming sessions listed after the current one; the rest link to Bookings. */
const MAX_UPCOMING = 4;
/** Collapsing a single finished session would save nothing. */
const COLLAPSE_DONE_FROM = 2;

/**
 * Today at a glance, at a predictable size however busy the day is:
 * finished sessions collapse into one expandable line, and only the current
 * session plus the next few are listed — never an inner scroll area.
 */
@Component({
  selector: 'app-today-timeline',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="today__title">Today</h2>

    @if (items().length > 0) {
      <ol class="today__list" role="list">
        @if (collapseDone()) {
          <li class="today__item today__item--summary" data-state="done">
            <span class="today__marker" aria-hidden="true">
              <ng-container *ngTemplateOutlet="tick" />
            </span>
            <span class="today__summary-text">{{ doneSummary() }}</span>
            <button
              type="button"
              class="today__toggle"
              aria-controls="today-done-sessions"
              [attr.aria-expanded]="showDone()"
              (click)="showDone.set(!showDone())"
            >
              {{ showDone() ? 'Hide' : 'Show' }}
            </button>
          </li>
        }

        @if (doneItems().length > 0 && (!collapseDone() || showDone())) {
          <li class="today__group" id="today-done-sessions">
            <ol role="list" class="today__list">
              @for (item of doneItems(); track item.id) {
                <ng-container *ngTemplateOutlet="row; context: { $implicit: item }" />
              }
            </ol>
          </li>
        }

        @for (item of shownActive(); track item.id) {
          <ng-container *ngTemplateOutlet="row; context: { $implicit: item }" />
        }
      </ol>

      @if (hiddenLater() > 0) {
        <p class="today__more">
          + {{ hiddenLater() }} more later today
          <a class="today__more-link" [routerLink]="bookingsPath">View in Bookings</a>
        </p>
      }
    }

    <p class="today__footer">{{ footer() }}</p>

    <ng-template #row let-item>
      <li class="today__item" [attr.data-state]="item.state">
        <span class="today__marker" aria-hidden="true">
          @if (item.state === 'done') {
            <ng-container *ngTemplateOutlet="tick" />
          }
        </span>
        <span class="today__time">{{ item.time }}</span>
        <span class="today__client">{{ item.client }}</span>
        @if (item.note) {
          <span class="today__note">{{ item.note }}</span>
        }
      </li>
    </ng-template>

    <ng-template #tick>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
    </ng-template>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      padding: var(--space-lg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
    }

    .today__title {
      margin-bottom: var(--space-md);
      font-family: var(--font-sans);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    .today__list {
      display: grid;
      gap: var(--space-xs);
    }

    .today__item {
      display: grid;
      grid-template-columns: 1.25rem 3.25rem 1fr auto;
      align-items: center;
      gap: var(--space-sm);
      min-height: 2.5rem;
      padding: 0.375rem 0.5rem;
      border-radius: var(--radius-md);
      font-size: 0.9375rem;
      color: var(--color-text);

      &[data-state='done'] { color: var(--color-text-subtle); }

      &[data-state='now'] {
        background-color: var(--color-green-light);
        font-weight: 600;
      }
    }

    /* "✓ 4 done earlier  Show" spans the time and name columns. */
    .today__item--summary { grid-template-columns: 1.25rem 1fr auto; }

    .today__summary-text { color: var(--color-text-muted); }

    .today__toggle {
      min-height: 2rem;
      padding: 0 var(--space-sm);
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-green);
      cursor: pointer;

      &:hover { text-decoration: underline; }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 1px;
      }
    }

    .today__marker {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;

      [data-state='now'] > &::before,
      [data-state='upcoming'] > &::before {
        content: '';
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background-color: var(--color-green);
      }

      [data-state='upcoming'] > &::before {
        background-color: transparent;
        border: 1.5px solid var(--color-text-subtle);
      }
    }

    .today__time { font-variant-numeric: tabular-nums; }

    .today__note {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      white-space: nowrap;

      [data-state='now'] > & { color: var(--color-green); }
    }

    .today__more {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xs) var(--space-sm);
      margin-top: var(--space-sm);
      padding-left: calc(1.25rem + var(--space-sm) + 0.5rem);
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .today__more-link {
      font-weight: 600;
      color: var(--color-green);

      &:hover { text-decoration: underline; }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 2px;
        border-radius: var(--radius-sm);
      }
    }

    .today__footer {
      margin-top: auto;
      padding-top: var(--space-md);
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }
  `,
})
export class TodayTimelineComponent {
  /** Today's bookings, any status, in start order. */
  readonly bookings = input.required<readonly Booking[]>();
  readonly now = input.required<Date>();

  protected readonly bookingsPath = TherapistPaths.bookings;
  protected readonly showDone = signal(false);

  protected readonly items = computed<TimelineItem[]>(() =>
    this.bookings().map((booking) => {
      const status = displayStatus(booking, this.now());
      const state: ItemState =
        status === 'in-progress' ? 'now' : isUpcoming(booking, this.now()) ? 'upcoming' : 'done';
      return {
        id: booking.id,
        time: formatTime(booking.start),
        client: abbreviatedName(booking.clientName),
        state,
        note: state === 'now' ? 'Now' : NOTE_STATUSES.has(status) ? STATUS_LABELS[status] : null,
      };
    }),
  );

  protected readonly doneItems = computed(() => this.items().filter((i) => i.state === 'done'));
  private readonly activeItems = computed(() => this.items().filter((i) => i.state !== 'done'));

  protected readonly collapseDone = computed(() => this.doneItems().length >= COLLAPSE_DONE_FROM);

  /** The current session (if any) plus the next few. */
  protected readonly shownActive = computed(() => {
    const active = this.activeItems();
    const current = active.filter((i) => i.state === 'now');
    return [...current, ...active.filter((i) => i.state === 'upcoming').slice(0, MAX_UPCOMING)];
  });

  protected readonly hiddenLater = computed(
    () => this.activeItems().length - this.shownActive().length,
  );

  protected readonly doneSummary = computed(() => {
    const count = this.doneItems().length;
    return this.activeItems().length > 0 ? `${count} done earlier` : `${count} done`;
  });

  protected readonly footer = computed(() => {
    if (this.items().length === 0) return 'No sessions today.';

    const remaining = this.activeItems().length;
    if (remaining > 0) return `${remaining} still to come`;

    const completed = this.bookings().filter((b) => b.status === 'completed').length;
    return completed > 0
      ? `You're done for today 🌿 ${completed} ${completed === 1 ? 'session' : 'sessions'} completed.`
      : "You're done for today 🌿";
  });
}

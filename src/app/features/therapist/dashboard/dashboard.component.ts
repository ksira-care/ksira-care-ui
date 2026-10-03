import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { byStartAscending, isOnSameDay, nextSession } from '../bookings/booking-rules';
import { BookingsGateway } from '../bookings/bookings.gateway';
import { firstName } from '../person-name';
import { injectNow } from '../portal-clock';
import {
  PORTAL_TIME_ZONE_LABEL,
  formatLongDate,
  formatLongMonthYear,
  formatMonthYear,
  DAY_MS,
  greetingFor,
  portalDayRange,
} from '../portal-time';
import { TherapistPaths } from '../therapist-paths';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardSummary } from './dashboard.models';
import { NextSessionCardComponent } from './next-session-card.component';
import { StatCardComponent } from './stat-card.component';
import { LoadErrorComponent } from '../ui/load-error.component';
import { TodayTimelineComponent } from './today-timeline.component';

interface StatView {
  readonly label: string;
  readonly value: string;
  readonly caption: string;
}

const numberFormat = new Intl.NumberFormat('en-IN');

/** How far ahead to look for the next session when today is done. */
const LOOKAHEAD_DAYS = 14;

/**
 * Answers "what's next?" at a glance and fits on one screen: the next session,
 * today's timeline, and a slim strip of totals. Full history lives on the
 * Bookings page.
 */
@Component({
  selector: 'app-therapist-dashboard',
  standalone: true,
  imports: [
    StatCardComponent,
    NextSessionCardComponent,
    TodayTimelineComponent,
    LoadErrorComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="dashboard__header">
      <h1 class="section-title dashboard__greeting">{{ greeting() }}</h1>
      <p class="dashboard__date">{{ dateLine() }}</p>
    </header>

    <div class="dashboard__layout">
      @if (upcoming.hasValue()) {
        <app-next-session-card class="dashboard__next" [booking]="next()" [now]="now()" />
        <app-today-timeline class="dashboard__today" [bookings]="today()" [now]="now()" />
      } @else if (upcoming.error()) {
        <app-load-error
          class="dashboard__next"
          message="We couldn't load your sessions."
          (retry)="upcoming.reload()"
        />
      } @else {
        <div class="skeleton dashboard__skeleton dashboard__skeleton--tall dashboard__next" aria-busy="true">
          <span class="visually-hidden">Loading your sessions…</span>
        </div>
        <div class="skeleton dashboard__skeleton dashboard__skeleton--tall dashboard__today" aria-hidden="true"></div>
      }

      <section class="dashboard__totals" aria-label="Your totals">
        @if (summary.hasValue()) {
          <dl class="dashboard__stats">
            @for (stat of stats(); track stat.label) {
              <div
                appStatCard
                [compact]="true"
                [label]="stat.label"
                [value]="stat.value"
                [caption]="stat.caption"
              ></div>
            }
          </dl>
        } @else if (summary.error()) {
          <app-load-error message="We couldn't load your totals." (retry)="summary.reload()" />
        } @else {
          <div class="dashboard__stats" aria-busy="true">
            <span class="visually-hidden">Loading your totals…</span>
            <div class="skeleton dashboard__skeleton" aria-hidden="true"></div>
            <div class="skeleton dashboard__skeleton" aria-hidden="true"></div>
          </div>
        }
      </section>

      <a class="dashboard__all-bookings" [routerLink]="bookingsPath">
        View all bookings
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </a>
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding-block: var(--space-2xl);
    }

    .dashboard__header { margin-bottom: var(--space-xl); }

    .dashboard__greeting { margin-bottom: var(--space-xs); }

    .dashboard__date {
      font-size: 0.9375rem;
      color: var(--color-text-muted);
    }

    /*
     * Desktop: the next session, totals and link stack on the left while the
     * Today list runs down the right, so neither column leaves an empty gap.
     * Phones: one column, in order of urgency.
     */
    .dashboard__layout {
      display: grid;
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      grid-template-rows: auto auto 1fr;
      grid-template-areas:
        'next   today'
        'totals today'
        'link   today';
      align-items: start;
      gap: var(--space-lg);

      @media (max-width: 860px) {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
        grid-template-areas: 'next' 'today' 'totals' 'link';
      }
    }

    .dashboard__next { grid-area: next; }
    .dashboard__today { grid-area: today; }
    .dashboard__totals { grid-area: totals; }

    /* Always two side by side — they're short enough even on phones. */
    .dashboard__stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-lg);

      @media (max-width: 480px) { gap: var(--space-sm); }
    }

    .dashboard__skeleton { min-height: 96px; }

    .dashboard__skeleton--tall { min-height: 220px; }


    .dashboard__all-bookings {
      grid-area: link;
      justify-self: start;
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      min-height: 44px;
      font-weight: 600;
      color: var(--color-green);

      &:hover { text-decoration: underline; }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 2px;
        border-radius: var(--radius-sm);
      }
    }
  `,
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly dashboardGateway = inject(DashboardGateway);
  private readonly bookingsGateway = inject(BookingsGateway);

  /** Ticks so countdowns, "now" and the greeting stay current while the page is open. */
  protected readonly now = injectNow();
  protected readonly bookingsPath = TherapistPaths.bookings;

  protected readonly greeting = computed(() => {
    const name = firstName(this.auth.user()?.name);
    const greeting = greetingFor(this.now());
    return name ? `${greeting}, ${name}.` : `${greeting}.`;
  });

  protected readonly dateLine = computed(
    () => `${formatLongDate(this.now())} · all times ${PORTAL_TIME_ZONE_LABEL}`,
  );

  protected readonly summary = rxResource({ stream: () => this.dashboardGateway.getSummary() });

  /** Today plus the next two weeks: enough for today's list and the next session. */
  protected readonly upcoming = rxResource({
    stream: () => {
      const today = portalDayRange(new Date());
      const end = new Date(today.start.getTime() + LOOKAHEAD_DAYS * DAY_MS);
      return this.bookingsGateway.getBookings({ start: today.start, end });
    },
  });

  protected readonly today = computed(() =>
    this.upcoming.hasValue()
      ? this.upcoming.value().filter((b) => isOnSameDay(b, this.now())).sort(byStartAscending)
      : [],
  );

  protected readonly next = computed(() =>
    this.upcoming.hasValue() ? nextSession(this.upcoming.value(), this.now()) : null,
  );

  protected readonly stats = computed(() =>
    this.summary.hasValue() ? this.toStatViews(this.summary.value()) : [],
  );

  private toStatViews(summary: DashboardSummary): StatView[] {
    return [
      {
        label: 'Completed this month',
        value: numberFormat.format(summary.completedThisMonth),
        caption: formatLongMonthYear(this.now()),
      },
      {
        label: 'Completed all-time',
        value: numberFormat.format(summary.completedAllTime),
        caption: summary.activeSince
          ? `Since ${formatMonthYear(summary.activeSince)}`
          : 'Across all your sessions',
      },
    ];
  }
}

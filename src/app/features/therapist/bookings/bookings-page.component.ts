import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { abbreviatedName } from '../person-name';
import { LoadErrorComponent } from '../ui/load-error.component';
import { TabBarComponent, TabOption } from '../ui/tab-bar.component';
import { BookingCardComponent } from './booking-card.component';
import { needsMarking } from './booking-rules';
import { BookingsStore } from './bookings.store';

type Tab = 'today' | 'completed';

const PANEL_ID = 'bookings-panel';
const SKELETON_CARDS = [0, 1, 2];

/**
 * Where therapists close the loop on their sessions: "Today" lists what still
 * needs marking (including anything forgotten from earlier days), "Completed"
 * this month's marked sessions — with Undo until midnight for today's marks.
 */
@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [TabBarComponent, BookingCardComponent, LoadErrorComponent],
  providers: [BookingsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bookings-page__header">
      <h1 class="section-title bookings-page__title">Bookings</h1>
      <p class="bookings-page__subtitle">
        All times IST · Your coordinator emails the Google Meet link to you and the client before
        each session.
      </p>
    </header>

    <app-tab-bar
      #tabBar
      [tabs]="tabs()"
      [(selected)]="tab"
      label="Bookings"
      [panelId]="panelId"
    />

    <div
      class="bookings-page__panel"
      role="tabpanel"
      tabindex="0"
      [id]="panelId"
      [attr.aria-labelledby]="tabBar.tabId(tab())"
    >
      @if (store.bookings.hasValue()) {
        @if (overdueCount() > 0 && tab() === 'today') {
          <p class="bookings-page__attention" role="status">
            {{ overdueCount() }} past {{ overdueCount() === 1 ? 'session needs' : 'sessions need' }}
            marking.
          </p>
        }
        @if (visible().length > 0) {
          <ol class="bookings-page__list" role="list">
            @for (booking of visible(); track booking.id) {
              <li>
                <app-booking-card
                  [booking]="booking"
                  [now]="store.now()"
                  [mode]="tab() === 'today' ? 'to-mark' : 'completed'"
                  [busy]="store.busy().has(booking.id)"
                  [failed]="store.failed().has(booking.id)"
                  (mark)="store.mark(booking, $event)"
                  (undo)="store.undoMark(booking)"
                />
              </li>
            }
          </ol>
        } @else {
          <p class="bookings-page__empty">{{ emptyMessage() }}</p>
        }
      } @else if (store.bookings.error()) {
        <app-load-error
          message="We couldn't load your bookings."
          (retry)="store.bookings.reload()"
        />
      } @else {
        <div class="bookings-page__list" aria-busy="true">
          <span class="visually-hidden">Loading your bookings…</span>
          @for (card of skeletonCards; track card) {
            <div class="skeleton bookings-page__skeleton" aria-hidden="true"></div>
          }
        </div>
      }
    </div>

    <!-- Always present so screen readers announce marks and undos. -->
    <div class="bookings-page__live" role="status" aria-live="polite">
      @if (store.notice(); as notice) {
        <div class="toast">
          <span>{{ noticeText() }}</span>
          <button type="button" class="toast__undo" (click)="store.undoLatest()">Undo</button>
          <button type="button" class="toast__close" aria-label="Dismiss" (click)="store.dismissNotice()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding-block: var(--space-2xl);
    }

    .bookings-page__header { margin-bottom: var(--space-lg); }
    .bookings-page__title { margin-bottom: var(--space-xs); }

    .bookings-page__subtitle {
      max-width: 60ch;
      font-size: 0.9375rem;
      color: var(--color-text-muted);
    }

    .bookings-page__panel {
      padding-top: var(--space-lg);

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 4px;
        border-radius: var(--radius-sm);
      }
    }

    .bookings-page__attention {
      margin-bottom: var(--space-md);
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--color-crisis-border);
      border-radius: var(--radius-md);
      background-color: var(--color-crisis-bg);
      font-size: 0.9375rem;
      color: var(--color-crisis);
    }

    .bookings-page__list {
      display: grid;
      gap: var(--space-md);
    }

    .bookings-page__empty {
      padding: var(--space-xl) var(--space-lg);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-muted);
      text-align: center;
    }


    .bookings-page__skeleton { height: 150px; }

    .toast {
      position: fixed;
      bottom: var(--space-lg);
      left: 50%;
      z-index: 120;
      display: flex;
      align-items: center;
      gap: var(--space-md);
      max-width: calc(100vw - 2rem);
      padding: 0.625rem 0.75rem 0.625rem 1.25rem;
      border-radius: var(--radius-pill);
      background-color: var(--color-text);
      box-shadow: var(--shadow-md);
      font-size: 0.9375rem;
      color: #fff;
      transform: translateX(-50%);
    }

    .toast__undo,
    .toast__close {
      border: none;
      background: transparent;
      font-family: var(--font-sans);
      color: #fff;
      cursor: pointer;

      &:focus-visible { outline: 2px solid #fff; outline-offset: 2px; border-radius: var(--radius-sm); }
    }

    .toast__undo {
      font-weight: 700;
      text-decoration: underline;
    }

    .toast__close {
      display: inline-flex;
      padding: 0.25rem;
      opacity: 0.8;
    }
  `,
})
export class BookingsPageComponent {
  protected readonly store = inject(BookingsStore);

  protected readonly panelId = PANEL_ID;
  protected readonly skeletonCards = SKELETON_CARDS;
  protected readonly tab = signal<Tab>('today');

  protected readonly tabs = computed<TabOption<Tab>[]>(() => [
    {
      id: 'today',
      label: 'Today',
      count: this.store.bookings.hasValue() ? this.store.toMark().length : null,
    },
    { id: 'completed', label: 'Completed' },
  ]);

  protected readonly visible = computed(() =>
    this.tab() === 'today' ? this.store.toMark() : this.store.completed(),
  );

  protected readonly overdueCount = computed(
    () => this.store.toMark().filter((b) => needsMarking(b, this.store.now())).length,
  );

  protected readonly emptyMessage = computed(() =>
    this.tab() === 'today'
      ? 'Nothing left to mark today.'
      : 'No completed sessions this month yet.',
  );

  protected readonly noticeText = computed(() => {
    const notice = this.store.notice();
    if (!notice) return '';
    const client = abbreviatedName(notice.booking.clientName);
    return notice.status === 'completed'
      ? `Marked complete — ${client}`
      : `Marked as client didn't join — ${client}`;
  });
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CivilDate, addDays, startOf } from '../../../core/time/civil-date';
import { PORTAL_TIME_ZONE_LABEL, formatLongDate } from '../../../core/time/portal-time';
import { DateStripComponent } from '../../../shared/ui/date-strip.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error.component';
import { BookingFormDialogComponent } from './booking-form-dialog.component';
import { BookingRowComponent } from './booking-row.component';
import { CancelBookingDialogComponent } from './cancel-booking-dialog.component';
import { TodayStore } from './today.store';
import { AdminBooking } from './today.models';

/**
 * Where admins act on bookings: give each session an aapta, record that the
 * Meet link was emailed, and cancel when needed. Any day can be opened; a
 * booking can be changed from 24 h before it starts, so today and tomorrow
 * are where the work is.
 */
@Component({
  selector: 'app-admin-today-page',
  standalone: true,
  imports: [
    DateStripComponent,
    BookingRowComponent,
    LoadErrorComponent,
    BookingFormDialogComponent,
    CancelBookingDialogComponent,
  ],
  providers: [TodayStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div>
        <h1 class="section-title page-header__title">{{ title() }}</h1>
        <p class="page-header__subtitle">{{ subtitle() }}</p>
      </div>
      <app-date-strip
        [date]="store.date()"
        (dateChange)="store.showDay($event)"
        [today]="store.today"
        label="Choose a day"
      />
    </header>

    @if (store.bookings.hasValue()) {
      @if (store.bookings.value().length) {
        <div class="table-scroll">
          <table class="data-table today__table">
            <caption class="visually-hidden">Bookings on {{ subtitle() }}</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Client</th>
                <th scope="col">Aapta</th>
                <th scope="col">BCC email</th>
                <th scope="col">Outcome</th>
                <th scope="col"><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (booking of store.bookings.value(); track booking.id) {
                <tr
                  appBookingRow
                  [booking]="booking"
                  [now]="store.now()"
                  [editing]="store.editingId() === booking.id"
                  [options]="store.editingId() === booking.id && store.options.hasValue() ? store.options.value() : null"
                  [busy]="store.busyId() === booking.id"
                  [locked]="!!store.busyId() || (!!store.editingId() && store.editingId() !== booking.id)"
                  [error]="rowError(booking)"
                  (edit)="store.startEditing(booking)"
                  (discard)="store.stopEditing()"
                  (save)="store.allocate(booking, $event.aaptaId, $event.bccEmailSent)"
                  (viewForm)="formFor.set(booking)"
                  (requestCancel)="openCancel(booking)"
                ></tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="today__empty">No bookings on this day.</p>
      }
    } @else if (store.bookings.error()) {
      <app-load-error message="We couldn't load the bookings." (retry)="store.bookings.reload()" />
    } @else {
      <div class="skeleton today__loading" aria-busy="true"><span class="visually-hidden">Loading bookings…</span></div>
    }

    @if (formFor(); as booking) {
      <app-booking-form-dialog [booking]="booking" (openChange)="$event || formFor.set(null)" />
    }
    @if (cancelFor(); as booking) {
      <app-cancel-booking-dialog
        [booking]="booking"
        [busy]="store.busyId() === booking.id"
        [error]="rowError(booking)"
        (openChange)="$event || cancelFor.set(null)"
        (confirm)="cancel(booking, $event)"
      />
    }

    <!-- Always present so screen readers announce saves and failures. -->
    <div role="status" aria-live="polite">
      @if (store.notice(); as notice) {
        <p class="toast" [attr.data-tone]="notice.tone === 'success' ? 'success' : null">
          {{ notice.text }}
          <button type="button" class="icon-button today__dismiss" aria-label="Dismiss" (click)="store.dismissNotice()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding-block: var(--space-2xl);
    }

    .today__empty {
      padding: var(--space-xl) var(--space-lg);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-muted);
      text-align: center;
    }

    .today__table { min-width: 60rem; }

    .today__loading { height: 18rem; }

    .today__dismiss { color: inherit; width: 1.5rem; height: 1.5rem; }
  `,
})
export class TodayPageComponent {
  protected readonly store = inject(TodayStore);

  protected readonly formFor = signal<AdminBooking | null>(null);
  protected readonly cancelFor = signal<AdminBooking | null>(null);

  protected readonly title = computed(() => {
    const date = this.store.date();
    if (date === this.store.today) return 'Today';
    if (date === addDays(this.store.today, 1)) return 'Tomorrow';
    return 'Bookings';
  });

  protected readonly subtitle = computed(
    () => `${formatLongDate(startOf(this.store.date() as CivilDate))} · all times ${PORTAL_TIME_ZONE_LABEL}`,
  );

  protected rowError(booking: AdminBooking): string | null {
    const error = this.store.rowError();
    return error?.bookingId === booking.id ? error.text : null;
  }

  protected openCancel(booking: AdminBooking): void {
    this.store.rowError.set(null);
    this.cancelFor.set(booking);
  }

  protected cancel(booking: AdminBooking, reason: string): void {
    this.store.cancel(booking, reason, (cancelled) => {
      if (cancelled) this.cancelFor.set(null);
    });
  }
}

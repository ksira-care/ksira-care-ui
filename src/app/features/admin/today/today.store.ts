import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize } from 'rxjs';
import { ApiError } from '../../../core/http/api-error';
import { CivilDate, portalToday } from '../../../core/time/civil-date';
import { injectNow } from '../../../core/time/portal-clock';
import { TodayGateway } from './today.gateway';
import { AdminBooking } from './today.models';

const NOTICE_MS = 5000;

export interface Notice {
  readonly tone: 'success' | 'error';
  readonly text: string;
}

/** Why a save or cancel failed, in words the admin can act on. */
const FAILURES: Readonly<Record<string, string>> = {
  AAPTA_NOT_AVAILABLE: "That aapta isn't free at this hour any more. Please pick someone else.",
  BOOKING_NOT_EDITABLE: "This booking can't be changed any more.",
  BOOKING_NOT_CANCELLABLE: 'This session has already been marked, so it can no longer be cancelled.',
  CONCURRENT_UPDATE: 'Someone else changed this booking just now. The latest version is shown; please try again.',
  NETWORK: "We couldn't reach the server. Check your connection and try again.",
};

/**
 * State for the Today page: the chosen day's bookings, the one row being
 * edited (with its aapta options), and saving or cancelling a booking. Rows
 * are replaced with what the server answers, so the table always shows the
 * saved truth.
 */
@Injectable()
export class TodayStore {
  private readonly gateway = inject(TodayGateway);
  private readonly destroyRef = inject(DestroyRef);

  readonly now = injectNow();
  readonly today = portalToday(new Date());
  readonly date = signal<CivilDate>(this.today);

  readonly bookings = rxResource({
    params: () => this.date(),
    stream: ({ params: date }) => this.gateway.getDay(date),
  });

  /** The row whose aapta and BCC flag are being changed, if any. */
  readonly editingId = signal<string | null>(null);
  readonly options = rxResource({
    params: () => this.editingId() ?? undefined,
    stream: ({ params: bookingId }) => this.gateway.getAaptaOptions(bookingId),
  });

  readonly busyId = signal<string | null>(null);
  /** A failure to show on one row. */
  readonly rowError = signal<{ readonly bookingId: string; readonly text: string } | null>(null);
  readonly notice = signal<Notice | null>(null);
  private noticeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.noticeTimer));
  }

  showDay(date: CivilDate): void {
    this.stopEditing();
    this.date.set(date);
  }

  startEditing(booking: AdminBooking): void {
    this.rowError.set(null);
    this.editingId.set(booking.id);
  }

  stopEditing(): void {
    this.editingId.set(null);
    this.rowError.set(null);
  }

  allocate(booking: AdminBooking, aaptaId: string, bccEmailSent: boolean): void {
    this.run(booking, this.gateway.allocate(booking.id, { aaptaId, bccEmailSent, version: booking.version }), (saved) => {
      this.editingId.set(null);
      const aapta = saved.aapta ? `${saved.aapta.firstName} ${saved.aapta.lastName}` : 'no one';
      this.flash({ tone: 'success', text: `Saved. ${saved.client.name} is with ${aapta}.` });
    });
  }

  /** Resolves true once cancelled, so the confirmation can close. */
  cancel(booking: AdminBooking, reason: string, done: (cancelled: boolean) => void): void {
    this.run(booking, this.gateway.cancel(booking.id, reason, booking.version), (saved) => {
      this.flash({ tone: 'success', text: `Cancelled ${saved.client.name}'s session.` });
      done(true);
    }, () => done(false));
  }

  dismissNotice(): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(null);
  }

  private run(booking: AdminBooking, request: Observable<AdminBooking>,
              onSaved: (saved: AdminBooking) => void, onFailed?: () => void): void {
    if (this.busyId()) return;
    this.busyId.set(booking.id);
    this.rowError.set(null);
    request
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.bookings.update((rows) => rows?.map((row) => (row.id === saved.id ? saved : row)));
          onSaved(saved);
        },
        error: (error: unknown) => {
          this.handleFailure(booking, error);
          onFailed?.();
        },
      });
  }

  private handleFailure(booking: AdminBooking, error: unknown): void {
    const code = error instanceof ApiError ? error.code : 'UNKNOWN';
    const text = FAILURES[code] ?? "We couldn't save that. Please try again.";
    // The table is out of date: show what's true now.
    if (code === 'CONCURRENT_UPDATE' || code === 'BOOKING_NOT_EDITABLE' || code === 'BOOKING_NOT_CANCELLABLE') {
      this.editingId.set(null);
      this.bookings.reload();
      this.flash({ tone: 'error', text });
      return;
    }
    if (code === 'AAPTA_NOT_AVAILABLE') this.options.reload();
    this.rowError.set({ bookingId: booking.id, text });
  }

  private flash(notice: Notice): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(notice);
    this.noticeTimer = setTimeout(() => this.notice.set(null), NOTICE_MS);
  }
}

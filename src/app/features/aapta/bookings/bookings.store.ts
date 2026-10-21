import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { addDays, portalToday, startOf } from '../../../core/time/civil-date';
import { injectNow } from '../../../core/time/portal-clock';
import { DateRange, portalDayRange } from '../../../core/time/portal-time';
import { byStartAscending, byStartDescending, isOnSameDay } from './booking-rules';
import { Booking, AaptaSetStatus } from './booking.models';
import { BookingsGateway } from './bookings.gateway';

/**
 * How far back the portal looks. Matches the dashboard's "last 30 days";
 * older months may already have been archived and deleted.
 */
export const LOOKBACK_DAYS = 30;
/** How long "Undo" is offered after marking a session. */
const UNDO_WINDOW_MS = 6000;

export interface MarkedNotice {
  readonly booking: Booking;
  readonly status: AaptaSetStatus;
}

/**
 * State for the bookings page: loads the last 30 days through today once
 * (which always covers the current month), applies the aapta's marks
 * locally as soon as the server accepts them, and lets them undo a mark until
 * the end of the day.
 */
@Injectable()
export class BookingsStore {
  private readonly gateway = inject(BookingsGateway);
  private readonly destroyRef = inject(DestroyRef);

  readonly now = injectNow();
  private readonly openedAt = new Date();

  readonly range: DateRange = {
    start: startOf(addDays(portalToday(this.openedAt), -LOOKBACK_DAYS)),
    end: portalDayRange(this.openedAt).end,
  };

  readonly bookings = rxResource({ stream: () => this.gateway.getBookings(this.range) });

  /** Marks made in this visit, layered over what was loaded. */
  private readonly marked = signal<ReadonlyMap<string, Pick<Booking, 'status' | 'markedAt'>>>(
    new Map(),
  );
  readonly busy = signal<ReadonlySet<string>>(new Set());
  readonly failed = signal<ReadonlySet<string>>(new Set());
  readonly notice = signal<MarkedNotice | null>(null);
  private noticeTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly all = computed<Booking[]>(() =>
    this.bookings.hasValue()
      ? this.bookings.value().map((b) => ({ ...b, ...this.marked().get(b.id) }))
      : [],
  );

  /**
   * Today's sessions still to be marked, in order. Earlier days never appear:
   * a session left unmarked when its day ends becomes an aapta no-show.
   */
  readonly toMark = computed(() =>
    this.all()
      .filter((b) => b.status === 'scheduled' && isOnSameDay(b, this.now()))
      .sort(byStartAscending),
  );

  /** Every marked session of the last 30 days, newest first. */
  readonly past = computed(() =>
    this.all()
      .filter((b) => b.status !== 'scheduled')
      .sort(byStartDescending),
  );

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.noticeTimer));
  }

  mark(booking: Booking, status: Exclude<AaptaSetStatus, 'scheduled'>): void {
    this.send(booking, status, () => this.showNotice({ booking, status }));
  }

  /** Takes back a mark — allowed until the end of the day it was made. */
  undoMark(booking: Booking): void {
    if (this.notice()?.booking.id === booking.id) this.hideNotice();
    this.send(booking, 'scheduled');
  }

  /** Undo from the "Marked complete" message. */
  undoLatest(): void {
    const notice = this.notice();
    if (notice) this.undoMark(notice.booking);
  }

  dismissNotice(): void {
    this.hideNotice();
  }

  private send(booking: Booking, status: AaptaSetStatus, onSuccess?: () => void): void {
    if (this.busy().has(booking.id)) return;
    this.busy.update((ids) => withItem(ids, booking.id));
    this.failed.update((ids) => withoutItem(ids, booking.id));

    this.gateway
      .updateStatus(booking.id, status)
      .pipe(
        finalize(() => this.busy.update((ids) => withoutItem(ids, booking.id))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const markedAt = status === 'scheduled' ? null : new Date();
          this.marked.update((map) => new Map(map).set(booking.id, { status, markedAt }));
          onSuccess?.();
        },
        error: () => this.failed.update((ids) => withItem(ids, booking.id)),
      });
  }

  private showNotice(notice: MarkedNotice): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(notice);
    this.noticeTimer = setTimeout(() => this.notice.set(null), UNDO_WINDOW_MS);
  }

  private hideNotice(): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(null);
  }
}

const withItem = (set: ReadonlySet<string>, item: string) => new Set(set).add(item);
const withoutItem = (set: ReadonlySet<string>, item: string) => {
  const next = new Set(set);
  next.delete(item);
  return next;
};

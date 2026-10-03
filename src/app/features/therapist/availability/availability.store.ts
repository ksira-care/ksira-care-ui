import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CivilDate, addDays } from '../civil-date';
import { injectNow } from '../portal-clock';
import { portalDay } from '../portal-time';
import { AvailabilityGateway } from './availability.gateway';
import {
  AvailabilityError,
  AvailabilityErrorCode,
  Slot,
  SlotChange,
  SlotStatus,
} from './availability.models';
import {
  bookingWindow,
  bookingWindowRange,
  hasStarted,
  hourStarts,
  slotKey,
  windowDays,
} from './availability-schedule';

/** How long the "Saved" confirmation stays up. */
const SAVED_NOTICE_MS = 4000;

export interface DaySummary {
  readonly open: number;
  readonly booked: number;
  readonly changed: boolean;
}

/**
 * State for the availability page. Keeps what the server has (`saved`) apart
 * from what the therapist has changed but not saved (`pending`), so edits can
 * span many days, be discarded in one go, and be saved as a single request.
 * Provided per page, so leaving the page drops unsaved state.
 */
@Injectable()
export class AvailabilityStore {
  private readonly gateway = inject(AvailabilityGateway);
  private readonly destroyRef = inject(DestroyRef);

  readonly now = injectNow();
  private readonly openedAt = new Date();
  readonly window = bookingWindow(this.openedAt);

  readonly slots = rxResource({
    stream: () => this.gateway.getSlots(bookingWindowRange(this.openedAt)),
  });

  private readonly saved = computed<ReadonlyMap<number, Slot>>(() =>
    this.slots.hasValue() ? new Map(this.slots.value().map((s) => [slotKey(s.start), s])) : new Map(),
  );

  /** Hour key → whether the therapist wants it open. Only differences from `saved`. */
  private readonly pending = signal<ReadonlyMap<number, boolean>>(new Map());

  readonly saving = signal(false);
  readonly saveError = signal<AvailabilityErrorCode | null>(null);
  readonly justSaved = signal(false);

  /** Changes still worth sending: not booked meanwhile, not already started. */
  readonly changes = computed<SlotChange[]>(() =>
    [...this.pending()]
      .filter(([key]) => this.saved().get(key)?.status !== 'booked' && !hasStarted(new Date(key), this.now()))
      .map(([key, open]) => ({ id: this.saved().get(key)?.id ?? null, start: new Date(key), open })),
  );

  readonly changeCount = computed(() => this.changes().length);
  readonly changedDayCount = computed(
    () => new Set(this.changes().map((c) => portalDay(c.start))).size,
  );

  readonly summaries = computed<ReadonlyMap<CivilDate, DaySummary>>(() => {
    const changedKeys = new Set(this.changes().map((c) => slotKey(c.start)));
    return new Map(
      windowDays(this.openedAt).map((day) => {
        const starts = hourStarts(day);
        const statuses = starts.map((start) => this.statusOf(start));
        return [
          day,
          {
            open: statuses.filter((s) => s === 'open').length,
            booked: statuses.filter((s) => s === 'booked').length,
            changed: starts.some((start) => changedKeys.has(slotKey(start))),
          },
        ];
      }),
    );
  });

  /** True when none of the next seven days has an open hour — clients can't book soon. */
  readonly nothingOpenThisWeek = computed(() => {
    const summaries = this.summaries();
    const week = [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(this.window.first, offset));
    return week.every((day) => (summaries.get(day)?.open ?? 0) === 0);
  });

  statusOf(start: Date): SlotStatus {
    const key = slotKey(start);
    const saved = this.saved().get(key);
    if (saved?.status === 'booked') return 'booked';
    const pending = this.pending().get(key);
    if (pending !== undefined) return pending ? 'open' : 'closed';
    return saved?.status ?? 'closed';
  }

  isEditable(start: Date): boolean {
    return this.statusOf(start) !== 'booked' && !hasStarted(start, this.now());
  }

  isChanged(start: Date): boolean {
    return this.pending().has(slotKey(start));
  }

  toggle(start: Date): void {
    if (this.isEditable(start)) this.setOpen(start, this.statusOf(start) !== 'open');
  }

  /** Opens or closes every hour on `day` that can still be changed. */
  setDay(day: CivilDate, open: boolean): void {
    for (const start of hourStarts(day)) {
      if (this.isEditable(start)) this.setOpen(start, open);
    }
  }

  discard(): void {
    this.pending.set(new Map());
    this.saveError.set(null);
  }

  save(): void {
    const changes = this.changes();
    if (changes.length === 0 || this.saving()) return;

    this.saving.set(true);
    this.saveError.set(null);
    this.justSaved.set(false);

    this.gateway
      .saveChanges(changes)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          // Show the saved state straight away, then confirm it with the server
          // in the background (the resource keeps its value while reloading).
          this.slots.update((slots) => applyChanges(slots ?? [], changes));
          this.pending.set(new Map());
          this.showSavedNotice();
          this.slots.reload();
        },
        error: (error: unknown) => {
          const code = error instanceof AvailabilityError ? error.code : 'unknown';
          this.saveError.set(code);
          // Fetch the latest so hours booked meanwhile show as locked; the
          // rest of the therapist's edits stay in place for another try.
          if (code === 'conflict') this.slots.reload();
        },
      });
  }

  private showSavedNotice(): void {
    this.justSaved.set(true);
    const timer = setTimeout(() => this.justSaved.set(false), SAVED_NOTICE_MS);
    this.destroyRef.onDestroy(() => clearTimeout(timer));
  }

  private setOpen(start: Date, open: boolean): void {
    const key = slotKey(start);
    const savedOpen = this.saved().get(key)?.status === 'open';
    const next = new Map(this.pending());
    if (open === savedOpen) next.delete(key);
    else next.set(key, open);
    this.pending.set(next);
    this.justSaved.set(false);
  }
}

function applyChanges(slots: readonly Slot[], changes: readonly SlotChange[]): Slot[] {
  const byKey = new Map(slots.map((slot) => [slotKey(slot.start), slot]));
  for (const change of changes) {
    byKey.set(slotKey(change.start), {
      id: change.id,
      start: change.start,
      status: change.open ? 'open' : 'closed',
    });
  }
  return [...byKey.values()];
}

import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { mockBookings } from '../bookings/mock-bookings.data';
import { DateRange } from '../portal-time';
import { AvailabilityGateway } from './availability.gateway';
import { AvailabilityError, Slot, SlotChange } from './availability.models';
import { hourStarts, slotKey, windowDays } from './availability-schedule';

const LATENCY_MS = 500;

/** Days (from today) left entirely closed, so the calendar shows unopened days. */
const UNOPENED_DAYS = { from: 15, to: 21 };

/**
 * In-memory stand-in for the slots API. Seeds a realistic pattern of open
 * hours, marks hours with a mock booking as booked, and remembers saves for
 * the rest of the session.
 */
@Injectable()
export class MockAvailabilityGateway extends AvailabilityGateway {
  private slots: Map<number, Slot> | null = null;

  override getSlots(range: DateRange): Observable<Slot[]> {
    return timer(LATENCY_MS).pipe(
      map(() =>
        [...this.store().values()].filter((s) => s.start >= range.start && s.start < range.end),
      ),
    );
  }

  override saveChanges(changes: readonly SlotChange[]): Observable<void> {
    return timer(LATENCY_MS).pipe(
      map(() => {
        const store = this.store();
        if (changes.some((c) => store.get(slotKey(c.start))?.status === 'booked')) {
          throw new AvailabilityError('conflict');
        }
        for (const change of changes) {
          store.set(slotKey(change.start), {
            id: change.id ?? `slot_${slotKey(change.start)}`,
            start: change.start,
            status: change.open ? 'open' : 'closed',
          });
        }
      }),
    );
  }

  private store(): Map<number, Slot> {
    return (this.slots ??= seed(new Date()));
  }
}

function seed(now: Date): Map<number, Slot> {
  const slots = new Map<number, Slot>();

  windowDays(now).forEach((day, index) => {
    const weekend = [0, 6].includes(new Date(`${day}T12:00:00+05:30`).getUTCDay());
    const unopened = index >= UNOPENED_DAYS.from && index <= UNOPENED_DAYS.to;

    hourStarts(day).forEach((start, hour) => {
      const open = !weekend && !unopened && (index * 5 + hour) % 3 !== 0;
      slots.set(slotKey(start), { id: `slot_${slotKey(start)}`, start, status: open ? 'open' : 'closed' });
    });
  });

  // Hours with a session already assigned are booked.
  for (const booking of mockBookings(now)) {
    const existing = slots.get(slotKey(booking.start));
    if (existing && booking.status === 'scheduled') {
      slots.set(slotKey(booking.start), { ...existing, status: 'booked' });
    }
  }
  return slots;
}

import { CivilDate, addDays, eachDay, portalToday, startOf } from '../civil-date';
import { DateRange, HOUR_MS } from '../portal-time';

/** First and last session start each day (IST). The last session ends at midnight. */
export const FIRST_HOUR = 9;
export const LAST_HOUR = 23;

/** How far ahead therapists can open hours. */
export const BOOKING_WINDOW_DAYS = 60;

/** Stable map key for an hour. */
export const slotKey = (start: Date): number => start.getTime();

/** Start times of every bookable hour on `day`. */
export function hourStarts(day: CivilDate): Date[] {
  const midnight = startOf(day).getTime();
  const starts: Date[] = [];
  for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour++) {
    starts.push(new Date(midnight + hour * HOUR_MS));
  }
  return starts;
}

/** Today through the last day therapists may open, inclusive. */
export function bookingWindow(now: Date): { first: CivilDate; last: CivilDate } {
  const first = portalToday(now);
  return { first, last: addDays(first, BOOKING_WINDOW_DAYS) };
}

/** The same window as a time range, for the API. */
export function bookingWindowRange(now: Date): DateRange {
  const { first, last } = bookingWindow(now);
  return { start: startOf(first), end: startOf(addDays(last, 1)) };
}

export function windowDays(now: Date): CivilDate[] {
  const { first, last } = bookingWindow(now);
  return eachDay(first, last);
}

/** An hour that has started (or is about to) can no longer be opened or closed. */
export function hasStarted(start: Date, now: Date): boolean {
  return start.getTime() <= now.getTime();
}

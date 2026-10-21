import { portalDay } from '../../../core/time/portal-time';
import { Booking } from './booking.models';

/** A session the aapta still has to hold — including one in progress. */
export function isUpcoming(booking: Booking, now: Date): boolean {
  return booking.status === 'scheduled' && booking.end > now;
}

export function isInProgress(booking: Booking, now: Date): boolean {
  return booking.status === 'scheduled' && booking.start <= now && now < booking.end;
}

/**
 * Over, but the aapta hasn't said how it went yet. Only today's: once the day
 * ends (IST), an unmarked session is recorded as an aapta no-show.
 */
export function needsMarking(booking: Booking, now: Date): boolean {
  return canMark(booking, now) && booking.end <= now;
}

/** Marking opens once the session has started, and closes when its day (IST) ends. */
export function canMark(booking: Booking, now: Date): boolean {
  return booking.status === 'scheduled' && booking.start <= now && isOnSameDay(booking, now);
}

/**
 * An aapta can take back their own mark until the end of the day (IST) on
 * which they made it. Aapta no-shows are recorded by the system and are final.
 */
export function canUndoMark(booking: Booking, now: Date): boolean {
  const aaptaMark = booking.status === 'completed' || booking.status === 'client-no-show';
  return aaptaMark && !!booking.markedAt && portalDay(booking.markedAt) === portalDay(now);
}

export function isOnSameDay(booking: Booking, date: Date): boolean {
  return portalDay(booking.start) === portalDay(date);
}

/** The session in progress, or else the soonest one still to come. */
export function nextSession(bookings: readonly Booking[], now: Date): Booking | null {
  return [...bookings].filter((b) => isUpcoming(b, now)).sort(byStartAscending)[0] ?? null;
}

export const byStartAscending = (a: Booking, b: Booking) => a.start.getTime() - b.start.getTime();
export const byStartDescending = (a: Booking, b: Booking) => b.start.getTime() - a.start.getTime();

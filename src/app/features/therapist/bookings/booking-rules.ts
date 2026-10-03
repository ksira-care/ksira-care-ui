import { portalDay } from '../portal-time';
import { Booking } from './booking.models';

/** A session the therapist still has to hold — including one in progress. */
export function isUpcoming(booking: Booking, now: Date): boolean {
  return booking.status === 'scheduled' && booking.end > now;
}

export function isInProgress(booking: Booking, now: Date): boolean {
  return booking.status === 'scheduled' && booking.start <= now && now < booking.end;
}

/** Over, but the therapist hasn't said how it went. */
export function needsMarking(booking: Booking, now: Date): boolean {
  return booking.status === 'scheduled' && booking.end <= now;
}

/** Marking opens once the session has started — not before. */
export function canMark(booking: Booking, now: Date): boolean {
  return booking.status === 'scheduled' && booking.start <= now;
}

/**
 * A therapist can take back their own mark until the end of the day (IST) on
 * which they made it. Therapist no-shows are recorded by admin and are final here.
 */
export function canUndoMark(booking: Booking, now: Date): boolean {
  const therapistMark = booking.status === 'completed' || booking.status === 'client-no-show';
  return therapistMark && !!booking.markedAt && portalDay(booking.markedAt) === portalDay(now);
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

import { formatTime, formatWeekdayDayMonth, portalDaysBetween } from '../../../core/time/portal-time';
import { isInProgress, needsMarking } from './booking-rules';
import { Booking, BookingStatus } from './booking.models';

/**
 * What the status badge shows — the API status plus two states the app
 * derives from the clock: "in progress" and "needs marking".
 */
export type DisplayStatus = BookingStatus | 'in-progress' | 'needs-marking';

export const STATUS_LABELS: Readonly<Record<DisplayStatus, string>> = {
  scheduled: 'Scheduled',
  'in-progress': 'In progress',
  'needs-marking': 'Needs marking',
  completed: 'Completed',
  'client-no-show': "Client didn't join",
  'aapta-no-show': 'Not marked — no-show',
  unknown: 'Unknown',
};

export function displayStatus(booking: Booking, now: Date): DisplayStatus {
  if (isInProgress(booking, now)) return 'in-progress';
  if (needsMarking(booking, now)) return 'needs-marking';
  return booking.status;
}

/** "16:00 – 17:00" */
export function formatTimeRange(booking: Booking): string {
  return `${formatTime(booking.start)} – ${formatTime(booking.end)}`;
}

/**
 * When a session starts, relative to now — so aaptas don't do clock maths:
 * "Happening now", "Starting now", "In 45 min", "In 2 h 10 min",
 * "Tomorrow at 09:00", "Mon 6 Oct at 09:00".
 */
export function formatStartsIn(booking: Booking, now: Date): string {
  if (isInProgress(booking, now)) return 'Happening now';

  const minutes = Math.round((booking.start.getTime() - now.getTime()) / 60_000);
  const days = portalDaysBetween(now, booking.start);
  const at = formatTime(booking.start);

  if (minutes <= 0) return 'Starting now';
  if (days === 0) {
    if (minutes < 60) return `In ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `In ${hours} h ${rest} min` : `In ${hours} h`;
  }
  if (days === 1) return `Tomorrow at ${at}`;
  return `${formatWeekdayDayMonth(booking.start)} at ${at}`;
}

/** "Ended 25 min ago", "Ended 3 h ago", "Ended yesterday", "Ended Fri 2 Oct". */
export function formatEndedAgo(booking: Booking, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - booking.end.getTime()) / 60_000));
  const days = portalDaysBetween(booking.end, now);
  if (days === 0) return minutes < 60 ? `Ended ${minutes} min ago` : `Ended ${Math.floor(minutes / 60)} h ago`;
  if (days === 1) return 'Ended yesterday';
  return `Ended ${formatWeekdayDayMonth(booking.end)}`;
}

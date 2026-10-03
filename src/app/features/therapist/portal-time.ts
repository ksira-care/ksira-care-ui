/**
 * The portal shows every date and time in IST, whatever timezone the
 * therapist's device is set to, so schedules always line up with clients.
 */
export const PORTAL_TIME_ZONE = 'Asia/Kolkata';
export const PORTAL_TIME_ZONE_LABEL = 'IST';

const hourFormat = new Intl.DateTimeFormat('en-GB', {
  hour: 'numeric',
  hourCycle: 'h23',
  timeZone: PORTAL_TIME_ZONE,
});

const longDateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: PORTAL_TIME_ZONE,
});

const longMonthYearFormat = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: PORTAL_TIME_ZONE,
});

const monthYearFormat = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: PORTAL_TIME_ZONE,
});

/** "Good morning" / "Good afternoon" / "Good evening" for the given moment in IST. */
export function greetingFor(date: Date): string {
  const hour = Number(hourFormat.format(date));
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** e.g. "Friday, 12 June 2026". Built from parts so the punctuation is stable across browsers. */
export function formatLongDate(date: Date): string {
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    longDateFormat.formatToParts(date).find((p) => p.type === type)?.value ?? '';
  return `${part('weekday')}, ${part('day')} ${part('month')} ${part('year')}`;
}

/** e.g. "June 2026". */
export function formatLongMonthYear(date: Date): string {
  return longMonthYearFormat.format(date);
}

/** e.g. "Jan 2025". */
export function formatMonthYear(date: Date): string {
  return monthYearFormat.format(date);
}

/** Parses an API calendar date ("2025-01-15") as midnight IST on that day. */
export function parsePortalDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00+05:30`);
}

/** A span of time; `end` is exclusive. */
export interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

// en-CA formats as YYYY-MM-DD, which is exactly what parsePortalDate expects.
const isoDayFormat = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: PORTAL_TIME_ZONE,
});

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: PORTAL_TIME_ZONE,
});

const dayMonthFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: PORTAL_TIME_ZONE,
});

/** The IST calendar day, as "2026-10-03". */
export function portalDay(date: Date): string {
  return isoDayFormat.format(date);
}

/** The IST calendar day containing `date`. IST has no daylight saving, so a day is always 24h. */
export function portalDayRange(date: Date): DateRange {
  const start = parsePortalDate(portalDay(date));
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** The IST calendar month containing `date`. */
export function portalMonthRange(date: Date): DateRange {
  const [year, month] = portalDay(date).split('-').map(Number);
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: parsePortalDate(`${year}-${pad(month)}-01`),
    end: parsePortalDate(`${next.year}-${pad(next.month)}-01`),
  };
}

/** e.g. "18:30". */
export function formatTime(date: Date): string {
  return timeFormat.format(date);
}

/** e.g. "11 Oct". */
export function formatDayMonth(date: Date): string {
  return dayMonthFormat.format(date);
}

const weekdayDayMonthFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: PORTAL_TIME_ZONE,
});

/** e.g. "Mon 6 Oct". */
export function formatWeekdayDayMonth(date: Date): string {
  return weekdayDayMonthFormat.format(date).replace(',', '');
}

/** Whole IST calendar days from `from` to `to` (0 = same day, 1 = tomorrow, -1 = yesterday). */
export function portalDaysBetween(from: Date, to: Date): number {
  const start = portalDayRange(from).start.getTime();
  const end = portalDayRange(to).start.getTime();
  return Math.round((end - start) / DAY_MS);
}

const dayLongFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: PORTAL_TIME_ZONE,
});

/** e.g. "Saturday, 3 October". */
export function formatDayLong(date: Date): string {
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dayLongFormat.formatToParts(date).find((p) => p.type === type)?.value ?? '';
  return `${part('weekday')}, ${part('day')} ${part('month')}`;
}

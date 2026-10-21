import { parsePortalDate, portalDay } from './portal-time';

/**
 * A calendar date with no time or timezone, as "YYYY-MM-DD". Calendar maths
 * (months, weekdays, adding days) is done on these so it can't drift with the
 * device's timezone; plain string comparison orders them correctly.
 */
export type CivilDate = string;

const toUtc = (date: CivilDate): Date => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const fromUtc = (date: Date): CivilDate => date.toISOString().slice(0, 10);

/** Today's date in the portal timezone (IST). */
export function portalToday(now: Date): CivilDate {
  return portalDay(now);
}

/** Midnight IST at the start of `date`. */
export function startOf(date: CivilDate): Date {
  return parsePortalDate(date);
}

export function addDays(date: CivilDate, days: number): CivilDate {
  const utc = toUtc(date);
  utc.setUTCDate(utc.getUTCDate() + days);
  return fromUtc(utc);
}

export function startOfMonth(date: CivilDate): CivilDate {
  return `${date.slice(0, 8)}01`;
}

export function addMonths(date: CivilDate, months: number): CivilDate {
  const utc = toUtc(date);
  return fromUtc(new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth() + months, 1)));
}

export function isSameMonth(a: CivilDate, b: CivilDate): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function dayOfMonth(date: CivilDate): number {
  return Number(date.slice(8));
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(date: CivilDate): number {
  return (toUtc(date).getUTCDay() + 6) % 7;
}

/** Every date from `from` to `to`, inclusive. */
export function eachDay(from: CivilDate, to: CivilDate): CivilDate[] {
  const days: CivilDate[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

/** Monday-first weeks covering the month that contains `month`. */
export function monthWeeks(month: CivilDate): CivilDate[][] {
  const first = startOfMonth(month);
  const last = addDays(addMonths(first, 1), -1);
  const gridStart = addDays(first, -weekdayIndex(first));
  const gridEnd = addDays(last, 6 - weekdayIndex(last));

  const weeks: CivilDate[][] = [];
  let week: CivilDate[] = [];
  for (const day of eachDay(gridStart, gridEnd)) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  return weeks;
}

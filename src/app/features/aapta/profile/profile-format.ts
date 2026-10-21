import { CivilDate } from '../../../core/time/civil-date';

const birthDateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "1991-03-14" → "14 Mar 1991". A birthday is a calendar date, so no timezone shift. */
export function formatBirthDate(date: CivilDate): string {
  const [year, month, day] = date.split('-').map(Number);
  return birthDateFormat.format(new Date(Date.UTC(year, month - 1, day)));
}

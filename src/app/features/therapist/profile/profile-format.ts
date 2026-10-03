import { CivilDate } from '../civil-date';
import { PostalAddress } from './profile.models';

const MASK = '•';

/**
 * "+919876543210" → "+91 98765 43210", or masked "+91 98••• ••210" so a
 * glance at the screen doesn't reveal the number. Other numbers are shown
 * as stored, masked the same way.
 */
export function formatPhone(phone: string, { masked }: { masked: boolean }): string {
  const compact = phone.replace(/[^\d+]/g, '');
  const india = /^\+91(\d{10})$/.exec(compact);
  if (india) {
    const digits = masked ? maskDigits(india[1]) : india[1];
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return masked ? compact.replace(/\d+/, maskDigits) : compact;
}

/** Keeps the first two and last three digits. */
function maskDigits(digits: string): string {
  return [...digits].map((d, i) => (i < 2 || i >= digits.length - 3 ? d : MASK)).join('');
}

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

/** "Flat 402, Green Meadows, Pune 411014" — the parts a person would write on an envelope. */
export function formatAddress(address: PostalAddress): string {
  const cityLine = [address.city, address.postalCode].filter(Boolean).join(' ');
  return [address.line1, address.line2, cityLine].filter(Boolean).join(', ');
}

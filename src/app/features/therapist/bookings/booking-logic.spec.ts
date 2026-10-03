import { abbreviatedName } from '../person-name';
import { portalDayRange, portalMonthRange } from '../portal-time';
import { displayStatus, formatLanguages, formatStartsIn, formatTimeRange } from './booking-format';
import { canUndoMark, isUpcoming, nextSession } from './booking-rules';
import { Booking } from './booking.models';
import { mockBookings } from './mock-bookings.data';

const ist = (isoLocal: string) => new Date(`${isoLocal}+05:30`);
const NOW = ist('2026-10-03T15:00');

function booking(start: string, overrides: Partial<Booking> = {}): Booking {
  const startDate = ist(start);
  return {
    id: start,
    start: startDate,
    end: new Date(startDate.getTime() + 60 * 60_000),
    clientName: 'Sara Lopez',
    reason: 'Work stress',
    status: 'scheduled',
    clientLanguages: ['en'],
    assignedAt: null,
    rescheduledFrom: null,
    rescheduleNote: null,
    markedAt: null,
    ...overrides,
  };
}

describe('IST ranges', () => {
  it('covers the IST day, even when the UTC date differs', () => {
    // 20:00 UTC on the 2nd is 01:30 on the 3rd in IST.
    const range = portalDayRange(new Date('2026-10-02T20:00:00Z'));

    expect(range.start).toEqual(ist('2026-10-03T00:00'));
    expect(range.end).toEqual(ist('2026-10-04T00:00'));
  });

  it('covers the IST month, rolling over the year in December', () => {
    const range = portalMonthRange(ist('2026-12-15T12:00'));

    expect(range.start).toEqual(ist('2026-12-01T00:00'));
    expect(range.end).toEqual(ist('2027-01-01T00:00'));
  });
});

describe('booking rules', () => {
  it.each([
    ['later today', booking('2026-10-03T17:30'), true],
    ['in progress', booking('2026-10-03T14:30'), true],
    ['already over', booking('2026-10-03T10:00'), false],
    ['next week', booking('2026-10-10T09:00'), true],
    ['later but marked no-show', booking('2026-10-03T17:30', { status: 'client-no-show' }), false],
  ])('isUpcoming: %s → %s', (_label, b, expected) => {
    expect(isUpcoming(b, NOW)).toBe(expected);
  });

  it('allows undoing a therapist mark only on the day it was made', () => {
    const markedToday = booking('2026-10-02T09:00', { status: 'completed', markedAt: ist('2026-10-03T08:00') });
    const markedYesterday = booking('2026-10-02T09:00', { status: 'completed', markedAt: ist('2026-10-02T23:59') });
    const adminNoShow = booking('2026-10-03T10:00', { status: 'therapist-no-show', markedAt: ist('2026-10-03T11:00') });

    expect(canUndoMark(markedToday, NOW)).toBe(true);
    expect(canUndoMark(markedYesterday, NOW)).toBe(false);
    expect(canUndoMark(adminNoShow, NOW)).toBe(false);
  });

  it('picks the session in progress, or else the soonest still to come', () => {
    const later = booking('2026-10-03T17:30');
    const live = booking('2026-10-03T14:30');
    const done = booking('2026-10-03T10:00', { status: 'completed' });

    expect(nextSession([later, done, live], NOW)).toBe(live);
    expect(nextSession([later, done], NOW)).toBe(later);
    expect(nextSession([done], NOW)).toBeNull();
  });
});

describe('booking formatting', () => {
  it('marks a scheduled session as in progress while it is happening', () => {
    expect(displayStatus(booking('2026-10-03T14:30'), NOW)).toBe('in-progress');
    expect(displayStatus(booking('2026-10-03T17:30'), NOW)).toBe('scheduled');
  });

  it.each([
    ['2026-10-03T14:30', 'Happening now'],
    ['2026-10-03T15:00:20', 'Starting now'],
    ['2026-10-03T15:45', 'In 45 min'],
    ['2026-10-03T17:10', 'In 2 h 10 min'],
    ['2026-10-03T18:00', 'In 3 h'],
    ['2026-10-04T09:00', 'Tomorrow at 09:00'],
    ['2026-10-06T16:00', 'Tue 6 Oct at 16:00'],
  ])('a session at %s starts "%s"', (start, expected) => {
    expect(formatStartsIn(booking(start), NOW)).toBe(expected);
  });

  it('formats times in IST', () => {
    expect(formatTimeRange(booking('2026-10-11T18:30'))).toBe('18:30 – 19:30');
  });

  it('turns language codes into names and leaves names alone', () => {
    expect(formatLanguages(['hi', 'en'])).toBe('Hindi, English');
    expect(formatLanguages(['Marathi'])).toBe('Marathi');
    expect(formatLanguages([])).toBe('');
  });

  it('shortens client names for privacy', () => {
    expect(abbreviatedName('Sara Lopez')).toBe('Sara L.');
    expect(abbreviatedName('Priya')).toBe('Priya');
  });
});

describe('mock bookings', () => {
  it('cover last month to next month, leaving only a few recent sessions unmarked', () => {
    const bookings = mockBookings(NOW);
    const next = portalMonthRange(portalMonthRange(NOW).end);
    const twoDaysAgo = new Date(NOW.getTime() - 2 * 24 * 60 * 60_000);

    expect(bookings.some((b) => b.start >= next.start)).toBe(true);
    expect(bookings.some((b) => b.start < portalMonthRange(NOW).start)).toBe(true);
    expect(nextSession(bookings, NOW)).not.toBeNull();
    expect(bookings.some((b) => b.status === 'scheduled' && b.end <= NOW)).toBe(true);
    expect(
      bookings.filter((b) => b.end <= twoDaysAgo).every((b) => b.status !== 'scheduled'),
    ).toBe(true);
  });
});

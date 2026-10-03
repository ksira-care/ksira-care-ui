import { formatLongDate, formatLongMonthYear, formatMonthYear, greetingFor } from './portal-time';

/** Builds a moment from an IST wall-clock time (IST is UTC+05:30, no DST). */
const ist = (isoLocal: string) => new Date(`${isoLocal}+05:30`);

describe('portal time', () => {
  it.each([
    ['2026-06-12T05:00', 'Good morning'],
    ['2026-06-12T11:59', 'Good morning'],
    ['2026-06-12T12:00', 'Good afternoon'],
    ['2026-06-12T16:59', 'Good afternoon'],
    ['2026-06-12T17:00', 'Good evening'],
    ['2026-06-12T04:59', 'Good evening'],
  ])('greets %s IST with "%s"', (time, expected) => {
    expect(greetingFor(ist(time))).toBe(expected);
  });

  it('uses IST rather than the device timezone near midnight', () => {
    // 20:00 UTC on the 11th is already 01:30 on the 12th in IST.
    const moment = new Date('2026-06-11T20:00:00Z');

    expect(formatLongDate(moment)).toBe('Friday, 12 June 2026');
  });

  it('formats months for captions', () => {
    expect(formatLongMonthYear(ist('2026-06-12T09:00'))).toBe('June 2026');
    expect(formatMonthYear(ist('2025-01-15T09:00'))).toBe('Jan 2025');
  });
});

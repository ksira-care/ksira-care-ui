import { addDays, addMonths, eachDay, monthWeeks, portalToday, weekdayIndex } from './civil-date';

describe('civil dates', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('moves between months, landing on the 1st', () => {
    expect(addMonths('2026-10-17', 1)).toBe('2026-11-01');
    expect(addMonths('2026-01-31', -1)).toBe('2025-12-01');
  });

  it('numbers weekdays from Monday', () => {
    expect(weekdayIndex('2026-10-05')).toBe(0); // Monday
    expect(weekdayIndex('2026-10-04')).toBe(6); // Sunday
  });

  it('builds Monday-first weeks that cover the whole month', () => {
    const weeks = monthWeeks('2026-10-15');

    expect(weeks[0][0]).toBe('2026-09-28');
    expect(weeks[weeks.length - 1][6]).toBe('2026-11-01');
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it('lists every day in a range, inclusive', () => {
    expect(eachDay('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
  });

  it("uses India's date, not the device's", () => {
    // 20:00 UTC on the 2nd is already the 3rd in IST.
    expect(portalToday(new Date('2026-10-02T20:00:00Z'))).toBe('2026-10-03');
  });
});

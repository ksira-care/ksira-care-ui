import { firstName, initials } from './person-name';

describe('therapist name formatting', () => {
  it.each([
    ['Aanya Mehta', 'Aanya', 'AM'],
    ['  Aanya   Priya  mehta ', 'Aanya', 'AM'],
    ['Aanya', 'Aanya', 'A'],
    ['', '', ''],
    [null, '', ''],
  ])('%j → first "%s", initials "%s"', (input, first, letters) => {
    expect(firstName(input)).toBe(first);
    expect(initials(input)).toBe(letters);
  });
});

import { homeFor, safeReturnUrl } from './auth-paths';

describe('homeFor', () => {
  it('opens each role in its own portal', () => {
    expect(homeFor('aapta')).toBe('/aapta');
    expect(homeFor('admin')).toBe('/admin');
  });
});

describe('safeReturnUrl', () => {
  it.each([
    ['/aapta', '/aapta'],
    ['/aapta/bookings?tab=past', '/aapta/bookings?tab=past'],
  ])('lets an aapta return to %s', (input, expected) => {
    expect(safeReturnUrl(input, 'aapta')).toBe(expected);
  });

  it.each([
    null,
    '',
    'https://evil.example',
    '//evil.example',
    '/about',
    '/aapta-fake',
    '/admin/bookings',
    '/login',
  ])('sends an aapta to their own home instead of %s', (input) => {
    expect(safeReturnUrl(input, 'aapta')).toBe('/aapta');
  });

  it("never sends an admin into the aapta portal", () => {
    expect(safeReturnUrl('/aapta/bookings', 'admin')).toBe('/admin');
    expect(safeReturnUrl('/admin/history', 'admin')).toBe('/admin/history');
  });
});

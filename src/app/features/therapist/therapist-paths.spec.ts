import { TherapistPaths, safeReturnUrl } from './therapist-paths';

describe('safeReturnUrl', () => {
  it.each([
    ['/therapist', '/therapist'],
    ['/therapist/sessions?day=mon', '/therapist/sessions?day=mon'],
  ])('allows portal URL %s', (input, expected) => {
    expect(safeReturnUrl(input)).toBe(expected);
  });

  it.each([
    null,
    '',
    'https://evil.example',
    '//evil.example',
    '/about',
    '/therapist-fake',
    '/therapist/login',
  ])('falls back to the portal home for %s', (input) => {
    expect(safeReturnUrl(input)).toBe(TherapistPaths.home);
  });
});

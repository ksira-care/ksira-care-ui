import { formatLanguages } from './languages';

describe('formatLanguages', () => {
  it('turns ISO codes into names', () => {
    expect(formatLanguages(['hi', 'en', 'mr', 'kn'])).toBe('Hindi, English, Marathi, Kannada');
    expect(formatLanguages([])).toBe('');
  });
});

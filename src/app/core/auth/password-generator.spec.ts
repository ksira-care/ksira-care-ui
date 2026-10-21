import { PASSWORD_LENGTH } from './auth.models';
import { generatePassword } from './password-generator';

describe('generatePassword', () => {
  it('makes long enough passwords of unambiguous characters', () => {
    const password = generatePassword();

    expect(password.length).toBeGreaterThanOrEqual(PASSWORD_LENGTH.min);
    expect(password).toMatch(/^[abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ2-9]+$/);
  });

  it('makes a different one each time', () => {
    expect(new Set(Array.from({ length: 20 }, () => generatePassword())).size).toBe(20);
  });
});

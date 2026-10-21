import { PASSWORD_LENGTH } from './auth.models';

/** Letters and digits that can't be mistaken for one another when read aloud or copied by hand. */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTH = 12;

/**
 * A random first password for a new account, from the browser's secure
 * random source. Rejection sampling keeps every character equally likely.
 */
export function generatePassword(length = LENGTH): string {
  const chars: string[] = [];
  const limit = 256 - (256 % ALPHABET.length);
  while (chars.length < Math.max(length, PASSWORD_LENGTH.min)) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (byte < limit && chars.length < length) chars.push(ALPHABET[byte % ALPHABET.length]);
    }
  }
  return chars.join('');
}

import { CivilDate } from '../../../core/time/civil-date';

/** The signed-in aapta's private details, as the app models them. */
export interface AaptaProfile {
  readonly firstName: string;
  readonly middleName: string | null;
  readonly lastName: string;
  /** Their login. Only an admin can change it. */
  readonly email: string;
  /** E.164, e.g. "+919876543210". */
  readonly phone: string | null;
  readonly dateOfBirth: CivilDate | null;
  /** ISO 639-1 codes, e.g. ["en", "hi"]. */
  readonly languages: readonly string[];
  /** One free-text line, as the aapta wrote it. */
  readonly address: string | null;
}

/**
 * The fields an aapta may change themselves; only those present change.
 * `null` clears an optional field. A date of birth, once given, can be
 * corrected but not removed.
 */
export interface ProfileChanges {
  readonly firstName?: string;
  readonly middleName?: string | null;
  readonly lastName?: string;
  readonly phone?: string | null;
  readonly dateOfBirth?: CivilDate;
  readonly address?: string | null;
  readonly languages?: readonly string[];
}

/** Field limits the server enforces; checked up front so the form can say so. */
export const PROFILE_LIMITS = { name: 100, address: 255 } as const;

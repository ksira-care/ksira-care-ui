import { CivilDate } from '../civil-date';

export interface PostalAddress {
  readonly line1: string;
  readonly line2: string | null;
  readonly city: string;
  readonly state: string | null;
  readonly postalCode: string;
  /** ISO 3166 code, e.g. "IN". */
  readonly country: string | null;
}

/** The signed-in therapist's private details, as the app models them. */
export interface TherapistProfile {
  readonly fullName: string;
  readonly email: string;
  /** E.164, e.g. "+919876543210". */
  readonly phone: string | null;
  readonly dateOfBirth: CivilDate | null;
  /** Language codes or names, as provided by the API. */
  readonly languages: readonly string[];
  readonly address: PostalAddress | null;
}

import { CivilDate } from '../../../core/time/civil-date';

/** An aapta on the roster, in the same format they see in their own portal. */
export interface AaptaAccount {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly middleName: string | null;
  readonly lastName: string;
  readonly phone: string | null;
  readonly dateOfBirth: CivilDate | null;
  readonly languages: readonly string[];
  readonly address: string | null;
}

/** "Add an Aapta": the admin sets up the login and shares it with them. */
export interface NewAapta {
  readonly firstName: string;
  readonly middleName: string | null;
  readonly lastName: string;
  readonly email: string;
  readonly languages: readonly string[];
  readonly password: string;
}

/** What an admin may change; everything else is the aapta's own to edit. */
export interface AaptaAccountChanges {
  /** Their login; changing it signs them out everywhere. */
  readonly email?: string;
  readonly languages?: readonly string[];
}

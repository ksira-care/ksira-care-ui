import { AaptaRef, Client, Outcome } from '../admin.models';

/** One booking on the Today page. */
export interface AdminBooking {
  readonly id: string;
  readonly start: Date;
  readonly end: Date;
  readonly client: Client;
  /** ISO 639-1; only aaptas who share one can take the session. */
  readonly clientLanguages: readonly string[];
  /** Who holds it; null while it still needs an aapta. */
  readonly aapta: AaptaRef | null;
  /** Who held it before the latest change, for the "Was …" line. */
  readonly previousAapta: AaptaRef | null;
  readonly bccEmailSent: boolean;
  readonly outcome: Outcome;
  /** Whether the aapta and BCC can be changed now (24 h before the start, until it starts). */
  readonly editable: boolean;
  readonly editableFrom: Date;
  /** Whether it can be cancelled now (any time, until the aapta marks it). */
  readonly cancellable: boolean;
  readonly cancelReason: string | null;
  /** Sent back with changes, so two admins can't overwrite each other unnoticed. */
  readonly version: number;
}

/** What the client entered on the website ("View form"). */
export interface BookingForm {
  readonly name: string;
  readonly email: string;
  readonly languages: readonly string[];
  readonly notes: string | null;
  readonly consent: boolean;
  readonly submittedAt: Date;
}

export interface AllocationChange {
  readonly aaptaId: string;
  readonly bccEmailSent: boolean;
  readonly version: number;
}

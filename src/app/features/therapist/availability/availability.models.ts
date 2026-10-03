/** What an hour means for clients. */
export type SlotStatus = 'open' | 'closed' | 'booked';

/** One bookable hour, as the server knows it. */
export interface Slot {
  /** Server id, if the hour already has a record. */
  readonly id: string | null;
  readonly start: Date;
  readonly status: SlotStatus;
}

/** A therapist's decision to open or close an hour. Booked hours can't be changed. */
export interface SlotChange {
  readonly id: string | null;
  readonly start: Date;
  readonly open: boolean;
}

export type AvailabilityErrorCode =
  /** Something changed on the server meanwhile (e.g. an hour was booked). */
  | 'conflict'
  | 'unknown';

export class AvailabilityError extends Error {
  constructor(
    readonly code: AvailabilityErrorCode,
    options?: ErrorOptions,
  ) {
    super(`Availability request failed: ${code}`, options);
    this.name = 'AvailabilityError';
  }
}

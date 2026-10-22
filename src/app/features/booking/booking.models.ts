/** An hour a client can book. */
export interface BookableHour {
  readonly start: Date;
  readonly end: Date;
}

/** What the website's booking form sends. */
export interface BookingRequest {
  readonly name: string;
  readonly email: string;
  readonly start: Date;
  /** ISO 639-1 codes; only aaptas who speak one of them are offered. */
  readonly languages: readonly string[];
  readonly notes: string | null;
}

export interface BookingConfirmation {
  readonly id: string;
  readonly start: Date;
  readonly end: Date;
}

/** Bookings start from this long ahead (the backend enforces it too). */
export const LEAD_TIME_HOURS = 2;
/** How far ahead the form looks for hours; matches how far ahead aaptas can open them. */
export const LOOKAHEAD_DAYS = 60;
export const NAME_LENGTH = { min: 2, max: 80 } as const;
export const NOTES_MAX = 500;

export type BookingStatus =
  | 'scheduled'
  | 'completed'
  | 'client-no-show'
  /** Not marked by midnight (IST) on the session's day; recorded by the system, and refunded. */
  | 'aapta-no-show'
  /** A status the app doesn't recognise yet — shown neutrally rather than guessed at. */
  | 'unknown';

/**
 * Statuses an aapta may set: marking a session done or the client absent,
 * or putting it back to scheduled (undo).
 */
export type AaptaSetStatus = Extract<BookingStatus, 'completed' | 'client-no-show' | 'scheduled'>;

/** A client session, as the app models it. */
export interface Booking {
  readonly id: string;
  readonly start: Date;
  readonly end: Date;
  readonly clientName: string;
  /** What the client said they're hoping for from the session. */
  readonly reason: string;
  readonly status: BookingStatus;
  /** Language codes or names, as provided by the API. */
  readonly clientLanguages: readonly string[];
  /** When an admin assigned the session to this aapta, if known. */
  readonly assignedAt: Date | null;
  /** The original start, if an admin moved the session. */
  readonly rescheduledFrom: Date | null;
  /** Why it was moved, e.g. "Client requested the change by email more than 24 h ahead." */
  readonly rescheduleNote: string | null;
  /** When the session was marked (complete / no-show), if it has been. */
  readonly markedAt: Date | null;
}

/** Times travel to and from the API as epoch milliseconds (UTC). */
export type EpochMillis = number;

export function toEpoch(date: Date): EpochMillis {
  return date.getTime();
}

export function fromEpoch(millis: EpochMillis): Date {
  return new Date(millis);
}

/** For optional times: `null` stays `null`. */
export function fromOptionalEpoch(millis: EpochMillis | null | undefined): Date | null {
  return millis === null || millis === undefined ? null : new Date(millis);
}

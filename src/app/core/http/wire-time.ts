/** Epoch timestamp (unit to be confirmed by backend) or ISO-8601 string. */
export type WireTime = number | string;

/**
 * Times are sent to the API as epoch milliseconds. If the backend expects
 * seconds, change this one function.
 */
export function toEpoch(date: Date): number {
  return date.getTime();
}

/**
 * Accepts epoch seconds, epoch milliseconds or ISO strings. Epoch seconds stay
 * below 1e12 until the year 33658, so the magnitude tells the units apart.
 */
export function fromWireTime(value: WireTime): Date {
  if (typeof value === 'string') return new Date(value);
  return new Date(value < 1e12 ? value * 1000 : value);
}

/** Uppercases and joins words with underscores: "client no-show" → "CLIENT_NO_SHOW". */
export function normaliseEnum(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

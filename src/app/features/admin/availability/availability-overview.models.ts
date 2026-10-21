import { AaptaRef } from '../admin.models';

/** One aapta at one hour, as they set it in their portal. */
export type HourState = 'open' | 'booked' | 'unavailable';

export interface AvailabilityCell {
  readonly start: Date;
  readonly state: HourState;
  /** Who the hour is booked for, when booked. */
  readonly clientName: string | null;
}

/** Every aapta's day, hour by hour; each aapta's cells line up with `hours`. */
export interface AvailabilityOverview {
  readonly hours: readonly { readonly start: Date; readonly openAaptas: number }[];
  readonly aaptas: readonly { readonly aapta: AaptaRef; readonly cells: readonly AvailabilityCell[] }[];
}

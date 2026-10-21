/** Types the admin console's pages share. */

/** An aapta as the console names them, e.g. in a dropdown. */
export interface AaptaRef {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
}

/** A client, identified by their email. */
export interface Client {
  readonly name: string;
  readonly email: string;
}

/** How a session turned out. Only the aapta (or the system, at midnight) sets it; admins cancel. */
export type Outcome = 'pending' | 'completed' | 'client-no-show' | 'aapta-no-show' | 'cancelled';

/** "Aanya Mehta" → "Aanya M.": enough to tell aaptas apart in a busy table. */
export function shortName(aapta: AaptaRef): string {
  return `${aapta.firstName} ${aapta.lastName.charAt(0)}.`;
}

export const OUTCOME_BY_WIRE: Readonly<Record<string, Outcome>> = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CLIENT_NO_SHOW: 'client-no-show',
  AAPTA_NO_SHOW: 'aapta-no-show',
  CANCELLED: 'cancelled',
};

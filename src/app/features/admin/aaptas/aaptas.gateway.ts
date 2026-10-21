import { Observable } from 'rxjs';
import { AaptaAccount, AaptaAccountChanges, NewAapta } from './aaptas.models';

/** Boundary between the Aaptas page and the API. Errors are `ApiError`s. */
export abstract class AaptasGateway {
  /** Everyone who can sign in, by name. */
  abstract getRoster(): Observable<AaptaAccount[]>;

  /** EMAIL_TAKEN if the email already has an account. */
  abstract create(aapta: NewAapta): Observable<AaptaAccount>;

  abstract update(aaptaId: string, changes: AaptaAccountChanges): Observable<AaptaAccount>;

  /** Ends their login; their upcoming sessions go back to needing an aapta. */
  abstract remove(aaptaId: string): Observable<{ readonly unallocatedBookings: number }>;
}

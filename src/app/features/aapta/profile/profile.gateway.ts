import { Observable } from 'rxjs';
import { AaptaProfile, ProfileChanges } from './profile.models';

/** Boundary between the profile page and the API. */
export abstract class ProfileGateway {
  /** The signed-in aapta's profile (identified by the session cookie). */
  abstract getProfile(): Observable<AaptaProfile>;

  /** Saves the aapta's own edits and answers with the profile as stored. */
  abstract updateProfile(changes: ProfileChanges): Observable<AaptaProfile>;
}

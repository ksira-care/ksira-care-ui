import { Observable } from 'rxjs';
import { TherapistProfile } from './profile.models';

/** Boundary between the profile page and the API. */
export abstract class ProfileGateway {
  /** The signed-in therapist's profile (identified by the session cookie). */
  abstract getProfile(): Observable<TherapistProfile>;
}

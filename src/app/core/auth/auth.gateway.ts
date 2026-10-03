import { Observable } from 'rxjs';
import { AuthenticatedUser, LoginCredentials } from './auth.models';

/**
 * Boundary between the app and whatever authenticates therapists.
 *
 * The session lives in an httpOnly cookie managed by the browser, so
 * implementations never see or store a token. They must translate every
 * transport failure into an `AuthError`, keeping callers API-agnostic.
 */
export abstract class AuthGateway {
  /** Starts a session. Errors with `AuthError` on failure. */
  abstract login(credentials: LoginCredentials): Observable<AuthenticatedUser>;

  /** The user behind the current session cookie, or `null` when there is none. */
  abstract fetchCurrentUser(): Observable<AuthenticatedUser | null>;

  /** Ends the session server-side, which clears the cookie. */
  abstract logout(): Observable<void>;
}

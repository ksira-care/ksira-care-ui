import { Observable } from 'rxjs';
import { AuthenticatedUser, LoginCredentials, PasswordChange } from './auth.models';

/**
 * Boundary between the app and whatever authenticates aaptas and admins.
 *
 * The session lives in an httpOnly cookie managed by the browser, so
 * implementations never see or store a token. They must translate every
 * transport failure into an `AuthError` / `PasswordChangeError`, keeping
 * callers API-agnostic.
 */
export abstract class AuthGateway {
  /** Starts a session; the user's `role` says which portal they belong to. */
  abstract login(credentials: LoginCredentials): Observable<AuthenticatedUser>;

  /** The user behind the current session cookie, or `null` when there is none. */
  abstract fetchCurrentUser(): Observable<AuthenticatedUser | null>;

  /** Ends the session server-side, which clears the cookie. */
  abstract logout(): Observable<void>;

  /** Changes the signed-in user's password; every other device is signed out. */
  abstract changePassword(change: PasswordChange): Observable<void>;
}

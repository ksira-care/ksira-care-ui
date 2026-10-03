/** Credentials a therapist signs in with. Accounts are provisioned by an admin. */
export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

/**
 * The signed-in user as the app models it — deliberately independent of the
 * API's wire format. Gateways map responses into this shape.
 */
export interface AuthenticatedUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

/** Every way authentication can fail that the UI needs to tell apart. */
export type AuthErrorCode =
  | 'invalid-credentials'
  | 'account-disabled'
  | 'rate-limited'
  | 'network'
  | 'unknown';

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    options?: ErrorOptions,
  ) {
    super(`Authentication failed: ${code}`, options);
    this.name = 'AuthError';
  }
}

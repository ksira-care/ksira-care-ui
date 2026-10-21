/** What a signed-in account is; decides which portal it opens. */
export type Role = 'aapta' | 'admin';

/** Credentials anyone signs in with. Accounts are provisioned by an admin. */
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
  readonly role: Role;
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

export interface PasswordChange {
  readonly currentPassword: string;
  readonly newPassword: string;
}

/** Password rules the server enforces; checked up front so the form can say so. */
export const PASSWORD_LENGTH = { min: 8, max: 72 } as const;

export type PasswordChangeErrorCode = 'current-password-incorrect' | 'network' | 'unknown';

export class PasswordChangeError extends Error {
  constructor(
    readonly code: PasswordChangeErrorCode,
    options?: ErrorOptions,
  ) {
    super(`Password change failed: ${code}`, options);
    this.name = 'PasswordChangeError';
  }
}

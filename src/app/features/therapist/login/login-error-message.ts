import { AuthError, AuthErrorCode } from '../../../core/auth/auth.models';

// A Record keeps this exhaustive: adding an AuthErrorCode won't compile until
// it has a message here.
const MESSAGES: Record<AuthErrorCode, string> = {
  // Deliberately doesn't say which field was wrong, so the form can't be used
  // to discover which emails have accounts.
  'invalid-credentials': 'Email or password is incorrect.',
  'account-disabled': 'Your account is inactive. Please contact your coordinator.',
  'rate-limited': 'Too many sign-in attempts. Please wait a few minutes and try again.',
  network: "We couldn't reach the server. Check your connection and try again.",
  unknown: 'Something went wrong. Please try again.',
};

export function loginErrorMessage(error: unknown): string {
  return MESSAGES[error instanceof AuthError ? error.code : 'unknown'];
}

import { Injectable } from '@angular/core';
import { Observable, of, switchMap, throwError, timer } from 'rxjs';
import { AuthGateway } from './auth.gateway';
import { AuthError, AuthErrorCode, AuthenticatedUser, LoginCredentials } from './auth.models';

interface MockAccount {
  readonly user: AuthenticatedUser;
  readonly password: string;
  readonly disabled?: boolean;
}

/**
 * Demo accounts:
 *   therapist@ksiracare.com / password123  → signs in
 *   disabled@ksiracare.com  / password123  → account disabled
 * Five consecutive wrong passwords trigger rate limiting.
 */
const MOCK_ACCOUNTS: readonly MockAccount[] = [
  {
    user: { id: 'th_001', name: 'Aanya Mehta', email: 'therapist@ksiracare.com' },
    password: 'password123',
  },
  {
    user: { id: 'th_002', name: 'Dev Mehta', email: 'disabled@ksiracare.com' },
    password: 'password123',
    disabled: true,
  },
];

const LATENCY_MS = 600;
const MAX_FAILED_ATTEMPTS = 5;
const SESSION_KEY = 'ksira.mock-session';

/**
 * In-memory stand-in for the auth API until it is deployed.
 * sessionStorage plays the role of the httpOnly cookie so a session survives reloads.
 */
@Injectable()
export class MockAuthGateway extends AuthGateway {
  private failedAttempts = 0;

  override login({ email, password }: LoginCredentials): Observable<AuthenticatedUser> {
    return this.respond(() => {
      if (this.failedAttempts >= MAX_FAILED_ATTEMPTS) return fail('rate-limited');

      const account = findAccount((a) => a.user.email === email.toLowerCase());
      if (!account || account.password !== password) {
        this.failedAttempts++;
        return fail('invalid-credentials');
      }
      if (account.disabled) return fail('account-disabled');

      this.failedAttempts = 0;
      writeSession(account.user.id);
      return of(account.user);
    });
  }

  override fetchCurrentUser(): Observable<AuthenticatedUser | null> {
    return this.respond(() => {
      const userId = readSession();
      return of(findAccount((a) => a.user.id === userId && !a.disabled)?.user ?? null);
    });
  }

  override logout(): Observable<void> {
    return this.respond(() => {
      clearSession();
      return of(undefined);
    });
  }

  /** Delays both values and errors (rxjs `delay` would let errors through instantly). */
  private respond<T>(handler: () => Observable<T>): Observable<T> {
    return timer(LATENCY_MS).pipe(switchMap(handler));
  }
}

function fail(code: AuthErrorCode): Observable<never> {
  return throwError(() => new AuthError(code));
}

function findAccount(predicate: (account: MockAccount) => boolean): MockAccount | undefined {
  return MOCK_ACCOUNTS.find(predicate);
}

// Storage can throw in private mode or when site data is blocked; the mock
// then simply behaves as if no session exists.
function readSession(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSession(userId: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, userId);
  } catch {
    /* ignore */
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

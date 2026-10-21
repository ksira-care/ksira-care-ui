import { Injectable } from '@angular/core';
import { Observable, of, switchMap, throwError, timer } from 'rxjs';
import { AuthGateway } from './auth.gateway';
import {
  AuthError,
  AuthErrorCode,
  AuthenticatedUser,
  LoginCredentials,
  PasswordChange,
  PasswordChangeError,
} from './auth.models';

interface MockAccount {
  readonly user: AuthenticatedUser;
  password: string;
  readonly disabled?: boolean;
}

/**
 * Demo accounts, the same as the backend's development data (password123):
 *   aapta@ksiracare.com    → the aapta portal
 *   admin@ksiracare.com    → the admin console
 *   disabled@ksiracare.com → account disabled
 * Five consecutive wrong passwords trigger rate limiting.
 */
function demoAccounts(): MockAccount[] {
  return [
    {
      user: { id: 'ap_001', name: 'Aanya Mehta', email: 'aapta@ksiracare.com', role: 'aapta' },
      password: 'password123',
    },
    {
      user: { id: 'ad_001', name: 'Meera Iyer', email: 'admin@ksiracare.com', role: 'admin' },
      password: 'password123',
    },
    {
      user: { id: 'ap_002', name: 'Dev Mehta', email: 'disabled@ksiracare.com', role: 'aapta' },
      password: 'password123',
      disabled: true,
    },
  ];
}

const LATENCY_MS = 600;
const MAX_FAILED_ATTEMPTS = 5;
const SESSION_KEY = 'ksira.mock-session';

/**
 * In-memory stand-in for the auth API in development.
 * sessionStorage plays the role of the httpOnly cookie so a session survives reloads.
 */
@Injectable()
export class MockAuthGateway extends AuthGateway {
  private readonly accounts = demoAccounts();
  private failedAttempts = 0;

  override login({ email, password }: LoginCredentials): Observable<AuthenticatedUser> {
    return this.respond(() => {
      if (this.failedAttempts >= MAX_FAILED_ATTEMPTS) return fail('rate-limited');

      const account = this.find((a) => a.user.email === email.toLowerCase());
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
    return this.respond(() => of(this.signedIn()?.user ?? null));
  }

  override logout(): Observable<void> {
    return this.respond(() => {
      clearSession();
      return of(undefined);
    });
  }

  override changePassword({ currentPassword, newPassword }: PasswordChange): Observable<void> {
    return this.respond(() => {
      const account = this.signedIn();
      if (!account || account.password !== currentPassword) {
        return throwError(() => new PasswordChangeError('current-password-incorrect'));
      }
      account.password = newPassword;
      return of(undefined);
    });
  }

  private signedIn(): MockAccount | undefined {
    const userId = readSession();
    return this.find((a) => a.user.id === userId && !a.disabled);
  }

  private find(predicate: (account: MockAccount) => boolean): MockAccount | undefined {
    return this.accounts.find(predicate);
  }

  /** Delays both values and errors (rxjs `delay` would let errors through instantly). */
  private respond<T>(handler: () => Observable<T>): Observable<T> {
    return timer(LATENCY_MS).pipe(switchMap(handler));
  }
}

function fail(code: AuthErrorCode): Observable<never> {
  return throwError(() => new AuthError(code));
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

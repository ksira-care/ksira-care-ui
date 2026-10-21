import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url';
import { problemCode } from '../http/problem-details';
import { fullName } from '../format/person-name';
import { expectsUnauthenticated } from './auth-http-context';
import { AuthGateway } from './auth.gateway';
import {
  AuthError,
  AuthErrorCode,
  AuthenticatedUser,
  LoginCredentials,
  PasswordChange,
  PasswordChangeError,
  Role,
} from './auth.models';

/** Paths relative to the API base, in one place in case the backend renames them. */
const ENDPOINTS = {
  login: '/auth/login',
  logout: '/auth/logout',
  /** Who is signed in, identified by the session cookie. */
  session: '/auth/session',
  password: '/auth/password',
} as const;

// ── Wire format (what the API sends) ────────────────────────

/** Both sign-in and the session check answer with this. */
interface SessionDto {
  readonly accountId: string;
  readonly email: string;
  readonly role: 'AAPTA' | 'ADMIN';
  readonly firstName: string;
  readonly middleName: string | null;
  readonly lastName: string;
}

const ROLE_BY_WIRE: Readonly<Record<SessionDto['role'], Role>> = {
  AAPTA: 'aapta',
  ADMIN: 'admin',
};

const ERROR_BY_CODE: Readonly<Record<string, AuthErrorCode>> = {
  INVALID_CREDENTIALS: 'invalid-credentials',
  ACCOUNT_DISABLED: 'account-disabled',
  RATE_LIMITED: 'rate-limited',
};

// Fallback when a response has no recognisable `code`.
const ERROR_BY_STATUS: Readonly<Partial<Record<number, AuthErrorCode>>> = {
  0: 'network',
  [HttpStatusCode.Unauthorized]: 'invalid-credentials',
  [HttpStatusCode.Forbidden]: 'account-disabled',
  [HttpStatusCode.TooManyRequests]: 'rate-limited',
};

/**
 * Talks to the real auth API. The session lives in an httpOnly cookie set and
 * cleared by the server; this class never sees the token.
 */
@Injectable()
export class HttpAuthGateway extends AuthGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  override login(credentials: LoginCredentials): Observable<AuthenticatedUser> {
    return this.http
      .post<SessionDto>(this.url('login'), credentials, { context: expectsUnauthenticated() })
      .pipe(
        map(toUser),
        catchError((error: unknown) => throwError(() => toAuthError(error))),
      );
  }

  override fetchCurrentUser(): Observable<AuthenticatedUser | null> {
    return this.http.get<SessionDto>(this.url('session'), { context: expectsUnauthenticated() }).pipe(
      map(toUser),
      catchError((error: unknown) =>
        isUnauthorized(error) ? of(null) : throwError(() => toAuthError(error)),
      ),
    );
  }

  override logout(): Observable<void> {
    return this.http
      .post<void>(this.url('logout'), null, { context: expectsUnauthenticated() })
      .pipe(
        map(() => undefined),
        catchError((error: unknown) => throwError(() => toAuthError(error))),
      );
  }

  override changePassword(change: PasswordChange): Observable<void> {
    return this.http.post<void>(this.url('password'), change).pipe(
      map(() => undefined),
      catchError((error: unknown) => throwError(() => toPasswordChangeError(error))),
    );
  }

  private url(endpoint: keyof typeof ENDPOINTS): string {
    return `${this.baseUrl}${ENDPOINTS[endpoint]}`;
  }
}

function toUser(dto: SessionDto): AuthenticatedUser {
  const role = ROLE_BY_WIRE[dto.role];
  // A role this app doesn't know can't open any portal; treat it as a failure, not a guess.
  if (!role) throw new AuthError('unknown');
  return { id: dto.accountId, email: dto.email, role, name: fullName(dto) };
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized;
}

function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  if (!(error instanceof HttpErrorResponse)) return new AuthError('unknown', { cause: error });

  const code = problemCode(error);
  const mapped = (code && ERROR_BY_CODE[code]) || ERROR_BY_STATUS[error.status] || 'unknown';
  return new AuthError(mapped, { cause: error });
}

function toPasswordChangeError(error: unknown): PasswordChangeError {
  if (!(error instanceof HttpErrorResponse)) return new PasswordChangeError('unknown', { cause: error });
  if (error.status === 0) return new PasswordChangeError('network', { cause: error });
  const incorrect = problemCode(error) === 'CURRENT_PASSWORD_INCORRECT';
  return new PasswordChangeError(incorrect ? 'current-password-incorrect' : 'unknown', { cause: error });
}

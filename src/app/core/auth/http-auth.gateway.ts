import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url';
import { problemCode } from '../http/problem-details';
import { expectsUnauthenticated } from './auth-http-context';
import { AuthGateway } from './auth.gateway';
import { AuthError, AuthErrorCode, AuthenticatedUser, LoginCredentials } from './auth.models';

/** Paths relative to the API base, in one place in case the backend renames them. */
const ENDPOINTS = {
  login: '/auth/login',
  logout: '/auth/logout',
  /** The signed-in therapist, identified by the session cookie. */
  profile: '/therapists/me',
} as const;

// ── Wire formats (what the API sends) ───────────────────────

/** Login only confirms identity; the name comes from the profile. */
interface LoginResponseDto {
  readonly therapistId: string;
  readonly email: string;
}

/** Only the fields sign-in needs; the profile page reads the rest. */
interface ProfileDto {
  readonly therapistId: string;
  readonly email: string;
  readonly firstName?: string | null;
  readonly middleName?: string | null;
  readonly lastName?: string | null;
  /** Single-string name from the first API draft. */
  readonly name?: string | null;
}

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
      .post<LoginResponseDto>(this.url('login'), credentials, { context: expectsUnauthenticated() })
      .pipe(
        switchMap(() => this.getProfile()),
        catchError((error: unknown) => throwError(() => toAuthError(error))),
      );
  }

  override fetchCurrentUser(): Observable<AuthenticatedUser | null> {
    return this.getProfile().pipe(
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

  /** Also serves as the "who is signed in?" check — the server identifies the therapist from the cookie. */
  private getProfile(): Observable<AuthenticatedUser> {
    return this.http
      .get<ProfileDto>(this.url('profile'), { context: expectsUnauthenticated() })
      .pipe(map(toUser));
  }

  private url(endpoint: keyof typeof ENDPOINTS): string {
    return `${this.baseUrl}${ENDPOINTS[endpoint]}`;
  }
}

function toUser(dto: ProfileDto): AuthenticatedUser {
  const parts = [dto.firstName, dto.middleName, dto.lastName].filter(Boolean);
  return { id: dto.therapistId, email: dto.email, name: parts.length ? parts.join(' ') : (dto.name ?? '') };
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

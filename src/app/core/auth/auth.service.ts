import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { AuthGateway } from './auth.gateway';
import { AuthenticatedUser, LoginCredentials } from './auth.models';

type SessionState =
  | { readonly status: 'unknown' }
  | { readonly status: 'anonymous' }
  | { readonly status: 'authenticated'; readonly user: AuthenticatedUser };

/**
 * Single source of truth for the therapist's session.
 *
 * With httpOnly cookies the client cannot inspect the session itself, so its
 * state starts as `unknown` and is resolved by asking the server once.
 */
@Injectable()
export class AuthService {
  private readonly gateway = inject(AuthGateway);
  private readonly state = signal<SessionState>({ status: 'unknown' });
  private pendingRestore: Observable<boolean> | null = null;

  readonly user = computed(() => {
    const state = this.state();
    return state.status === 'authenticated' ? state.user : null;
  });

  readonly isAuthenticated = computed(() => this.state().status === 'authenticated');

  /**
   * Resolves whether a session exists. Hits the server at most once per page
   * load; concurrent callers (e.g. several guards) share the same request.
   */
  restoreSession(): Observable<boolean> {
    const state = this.state();
    if (state.status !== 'unknown') return of(state.status === 'authenticated');

    this.pendingRestore ??= this.gateway.fetchCurrentUser().pipe(
      // If the server can't be reached, treat the user as signed out rather
      // than leaving navigation hanging.
      catchError(() => of(null)),
      map((user) => {
        this.setUser(user);
        return user !== null;
      }),
      finalize(() => (this.pendingRestore = null)),
      shareReplay(1),
    );
    return this.pendingRestore;
  }

  login(credentials: LoginCredentials): Observable<AuthenticatedUser> {
    return this.gateway.login(credentials).pipe(tap((user) => this.setUser(user)));
  }

  /** Always ends the local session, even if the server call fails. */
  logout(): Observable<void> {
    return this.gateway.logout().pipe(
      catchError(() => of(undefined)),
      tap(() => this.setUser(null)),
    );
  }

  /** The server rejected the session (e.g. it expired); forget it locally. */
  expireSession(): void {
    this.setUser(null);
  }

  private setUser(user: AuthenticatedUser | null): void {
    this.state.set(user ? { status: 'authenticated', user } : { status: 'anonymous' });
  }
}

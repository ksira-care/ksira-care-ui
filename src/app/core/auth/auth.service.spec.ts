import { TestBed } from '@angular/core/testing';
import { Observable, Subject, firstValueFrom, of, throwError } from 'rxjs';
import { AuthGateway } from './auth.gateway';
import { AuthError, AuthenticatedUser } from './auth.models';
import { AuthService } from './auth.service';

const USER: AuthenticatedUser = { id: 'th_1', name: 'Asha Rao', email: 'asha@ksiracare.com' };

class FakeGateway extends AuthGateway {
  login = vi.fn((): Observable<AuthenticatedUser> => of(USER));
  fetchCurrentUser = vi.fn((): Observable<AuthenticatedUser | null> => of(null));
  logout = vi.fn((): Observable<void> => of(undefined));
}

describe('AuthService', () => {
  let gateway: FakeGateway;
  let service: AuthService;

  beforeEach(() => {
    gateway = new FakeGateway();
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: AuthGateway, useValue: gateway }],
    });
    service = TestBed.inject(AuthService);
  });

  describe('restoreSession', () => {
    it('signs the user in when the server recognises the session', async () => {
      gateway.fetchCurrentUser.mockReturnValue(of(USER));

      expect(await firstValueFrom(service.restoreSession())).toBe(true);
      expect(service.user()).toEqual(USER);
    });

    it('treats an unreachable server as signed out', async () => {
      gateway.fetchCurrentUser.mockReturnValue(throwError(() => new AuthError('network')));

      expect(await firstValueFrom(service.restoreSession())).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('shares one request between concurrent callers', async () => {
      const response = new Subject<AuthenticatedUser | null>();
      gateway.fetchCurrentUser.mockReturnValue(response);

      const first = firstValueFrom(service.restoreSession());
      const second = firstValueFrom(service.restoreSession());
      response.next(USER);
      response.complete();

      expect(await Promise.all([first, second])).toEqual([true, true]);
      expect(gateway.fetchCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('does not ask the server again once the session is known', async () => {
      await firstValueFrom(service.restoreSession());
      await firstValueFrom(service.restoreSession());

      expect(gateway.fetchCurrentUser).toHaveBeenCalledTimes(1);
    });
  });

  it('stores the user after a successful login', async () => {
    await firstValueFrom(service.login({ email: USER.email, password: 'secret' }));

    expect(service.user()).toEqual(USER);
  });

  it('leaves the user signed out when login fails', async () => {
    gateway.login.mockReturnValue(throwError(() => new AuthError('invalid-credentials')));

    await expect(
      firstValueFrom(service.login({ email: USER.email, password: 'wrong' })),
    ).rejects.toBeInstanceOf(AuthError);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears the local session on logout even if the server call fails', async () => {
    await firstValueFrom(service.login({ email: USER.email, password: 'secret' }));
    gateway.logout.mockReturnValue(throwError(() => new AuthError('network')));

    await firstValueFrom(service.logout());

    expect(service.isAuthenticated()).toBe(false);
  });
});

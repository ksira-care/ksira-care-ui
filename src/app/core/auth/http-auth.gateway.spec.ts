import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url';
import { EXPECTS_UNAUTHENTICATED } from './auth-http-context';
import { AuthError, PasswordChangeError } from './auth.models';
import { HttpAuthGateway } from './http-auth.gateway';

const SESSION = {
  accountId: 'ap_1',
  email: 'aanya@ksiracare.com',
  role: 'AAPTA',
  firstName: 'Aanya',
  middleName: 'Priya',
  lastName: 'Mehta',
};
const USER = { id: 'ap_1', email: 'aanya@ksiracare.com', name: 'Aanya Priya Mehta', role: 'aapta' };

describe('HttpAuthGateway', () => {
  let gateway: HttpAuthGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpAuthGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    gateway = TestBed.inject(HttpAuthGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('login', () => {
    it('posts the credentials and learns who signed in, and as what', async () => {
      const result = firstValueFrom(gateway.login({ email: SESSION.email, password: 'secret' }));

      const login = http.expectOne({ method: 'POST', url: '/api/auth/login' });
      expect(login.request.body).toEqual({ email: SESSION.email, password: 'secret' });
      expect(login.request.context.get(EXPECTS_UNAUTHENTICATED)).toBe(true);
      login.flush(SESSION);

      expect(await result).toEqual(USER);
    });

    it('recognises an admin', async () => {
      const result = firstValueFrom(gateway.login({ email: 'meera@ksiracare.com', password: 'secret' }));
      http.expectOne('/api/auth/login').flush({ ...SESSION, role: 'ADMIN', middleName: null });

      expect(await result).toMatchObject({ role: 'admin', name: 'Aanya Mehta' });
    });

    it('refuses a role the app has no portal for', async () => {
      const result = firstValueFrom(gateway.login({ email: 'a@k.com', password: 'x' }));
      http.expectOne('/api/auth/login').flush({ ...SESSION, role: 'SUPERUSER' });

      await expect(result).rejects.toMatchObject({ code: 'unknown' });
    });

    it.each([
      [401, 'INVALID_CREDENTIALS', 'invalid-credentials'],
      [403, 'ACCOUNT_DISABLED', 'account-disabled'],
      [429, 'RATE_LIMITED', 'rate-limited'],
      [500, 'SOMETHING_NEW', 'unknown'],
    ])('maps HTTP %i / %s to "%s"', async (status, code, expected) => {
      const result = firstValueFrom(gateway.login({ email: 'a@k.com', password: 'x' }));

      http.expectOne('/api/auth/login').flush({ status, code }, { status, statusText: 'Error' });

      await expect(result).rejects.toMatchObject({ code: expected });
    });

    it('falls back to the status code when the body has no code', async () => {
      const result = firstValueFrom(gateway.login({ email: 'a@k.com', password: 'x' }));

      http.expectOne('/api/auth/login').flush('', { status: 429, statusText: 'Too Many Requests' });

      await expect(result).rejects.toMatchObject({ code: 'rate-limited' });
    });

    it('reports a network failure', async () => {
      const result = firstValueFrom(gateway.login({ email: 'a@k.com', password: 'x' }));

      http.expectOne('/api/auth/login').error(new ProgressEvent('error'));

      const error = await result.catch((e: unknown) => e);
      expect(error).toBeInstanceOf(AuthError);
      expect(error).toMatchObject({ code: 'network' });
    });
  });

  describe('fetchCurrentUser', () => {
    it('returns the user when a session exists', async () => {
      const result = firstValueFrom(gateway.fetchCurrentUser());

      const req = http.expectOne({ method: 'GET', url: '/api/auth/session' });
      expect(req.request.context.get(EXPECTS_UNAUTHENTICATED)).toBe(true);
      req.flush(SESSION);

      expect(await result).toEqual(USER);
    });

    it('returns null when there is no session', async () => {
      const result = firstValueFrom(gateway.fetchCurrentUser());

      http
        .expectOne('/api/auth/session')
        .flush({ code: 'UNAUTHENTICATED' }, { status: 401, statusText: 'Unauthorized' });

      expect(await result).toBeNull();
    });
  });

  it('logs out via the server so it can clear the cookie', async () => {
    const result = firstValueFrom(gateway.logout());

    http.expectOne({ method: 'POST', url: '/api/auth/logout' }).flush(null, { status: 204, statusText: 'No Content' });

    await expect(result).resolves.toBeUndefined();
  });

  describe('changePassword', () => {
    const change = { currentPassword: 'old-password', newPassword: 'new-password' };

    it('posts the current and new password', async () => {
      const result = firstValueFrom(gateway.changePassword(change));

      const req = http.expectOne({ method: 'POST', url: '/api/auth/password' });
      expect(req.request.body).toEqual(change);
      req.flush(null, { status: 204, statusText: 'No Content' });

      await expect(result).resolves.toBeUndefined();
    });

    it('says when the current password is wrong', async () => {
      const result = firstValueFrom(gateway.changePassword(change));

      http
        .expectOne('/api/auth/password')
        .flush({ code: 'CURRENT_PASSWORD_INCORRECT' }, { status: 422, statusText: 'Unprocessable' });

      const error = await result.catch((e: unknown) => e);
      expect(error).toBeInstanceOf(PasswordChangeError);
      expect(error).toMatchObject({ code: 'current-password-incorrect' });
    });
  });
});

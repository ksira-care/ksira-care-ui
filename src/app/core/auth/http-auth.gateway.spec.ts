import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url';
import { EXPECTS_UNAUTHENTICATED } from './auth-http-context';
import { AuthError } from './auth.models';
import { HttpAuthGateway } from './http-auth.gateway';

const PROFILE = {
  therapistId: 'th_1',
  email: 'aanya@ksiracare.com',
  firstName: 'Aanya',
  middleName: null,
  lastName: 'Mehta',
};
const USER = { id: 'th_1', email: 'aanya@ksiracare.com', name: 'Aanya Mehta' };

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
    it('posts the credentials, then loads the profile for the name', async () => {
      const result = firstValueFrom(gateway.login({ email: PROFILE.email, password: 'secret' }));

      const login = http.expectOne({ method: 'POST', url: '/api/auth/login' });
      expect(login.request.body).toEqual({ email: PROFILE.email, password: 'secret' });
      expect(login.request.context.get(EXPECTS_UNAUTHENTICATED)).toBe(true);
      login.flush({ therapistId: 'th_1', email: PROFILE.email });

      http.expectOne({ method: 'GET', url: '/api/therapists/me' }).flush(PROFILE);

      expect(await result).toEqual(USER);
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

  it('falls back to a single name field', async () => {
    const result = firstValueFrom(gateway.fetchCurrentUser());
    http
      .expectOne('/api/therapists/me')
      .flush({ therapistId: 'th_1', email: 'aanya@ksiracare.com', name: 'Aanya Mehta' });

    expect((await result)?.name).toBe('Aanya Mehta');
  });

  describe('fetchCurrentUser', () => {
    it('returns the profile when a session exists', async () => {
      const result = firstValueFrom(gateway.fetchCurrentUser());

      const req = http.expectOne({ method: 'GET', url: '/api/therapists/me' });
      expect(req.request.context.get(EXPECTS_UNAUTHENTICATED)).toBe(true);
      req.flush(PROFILE);

      expect(await result).toEqual(USER);
    });

    it('returns null when there is no session', async () => {
      const result = firstValueFrom(gateway.fetchCurrentUser());

      http.expectOne('/api/therapists/me').flush({ code: 'UNAUTHENTICATED' }, { status: 401, statusText: 'Unauthorized' });

      expect(await result).toBeNull();
    });
  });

  it('logs out via the server so it can clear the cookie', async () => {
    const result = firstValueFrom(gateway.logout());

    http.expectOne({ method: 'POST', url: '/api/auth/logout' }).flush(null, { status: 204, statusText: 'No Content' });

    await expect(result).resolves.toBeUndefined();
  });
});

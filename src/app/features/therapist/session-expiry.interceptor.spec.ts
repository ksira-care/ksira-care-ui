import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { expectsUnauthenticated } from '../../core/auth/auth-http-context';
import { AuthService } from '../../core/auth/auth.service';
import { API_BASE_URL } from '../../core/http/api-base-url';
import { apiCredentialsInterceptor } from '../../core/http/api-credentials.interceptor';
import { sessionExpiryInterceptor } from './session-expiry.interceptor';

describe('portal HTTP interceptors', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  const isAuthenticated = signal(true);
  const expireSession = vi.fn(() => isAuthenticated.set(false));

  beforeEach(() => {
    isAuthenticated.set(true);
    expireSession.mockClear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiCredentialsInterceptor, sessionExpiryInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: AuthService, useValue: { isAuthenticated, expireSession } },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  function unauthorized(url: string): void {
    http.expectOne(url).flush({ code: 'UNAUTHENTICATED' }, { status: 401, statusText: 'Unauthorized' });
  }

  it('sends the session cookie with API calls only', () => {
    client.get('/api/me/dashboard-summary').subscribe();
    client.get('https://cdn.example.com/file.json').subscribe();

    expect(http.expectOne('/api/me/dashboard-summary').request.withCredentials).toBe(true);
    expect(http.expectOne('https://cdn.example.com/file.json').request.withCredentials).toBe(false);
  });

  it('ends the session and sends the therapist to sign in when a call returns 401', async () => {
    const result = firstValueFrom(client.get('/api/me/dashboard-summary'));
    unauthorized('/api/me/dashboard-summary');
    await result.catch(() => undefined);

    expect(expireSession).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/therapist/login'], {
      queryParams: { reason: 'session-expired', returnUrl: '/' },
    });
  });

  it('ignores 401s that are an expected answer, like a wrong password', async () => {
    const result = firstValueFrom(client.post('/api/auth/login', {}, { context: expectsUnauthenticated() }));
    unauthorized('/api/auth/login');
    await result.catch(() => undefined);

    expect(expireSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('redirects only once when several calls fail together', async () => {
    const first = firstValueFrom(client.get('/api/a'));
    const second = firstValueFrom(client.get('/api/b'));
    unauthorized('/api/a');
    unauthorized('/api/b');
    await Promise.allSettled([first, second]);

    expect(navigate).toHaveBeenCalledTimes(1);
  });
});

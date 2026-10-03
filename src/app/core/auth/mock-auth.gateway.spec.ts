import { firstValueFrom } from 'rxjs';
import { MockAuthGateway } from './mock-auth.gateway';

describe('MockAuthGateway', () => {
  let gateway: MockAuthGateway;

  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    gateway = new MockAuthGateway();
  });

  afterEach(() => vi.useRealTimers());

  async function settle<T>(promise: Promise<T>): Promise<T> {
    await vi.runAllTimersAsync();
    return promise;
  }

  it('signs in the demo therapist and remembers the session', async () => {
    const user = await settle(
      firstValueFrom(gateway.login({ email: 'therapist@ksiracare.com', password: 'password123' })),
    );

    expect(user.name).toBe('Aanya Mehta');
    expect(await settle(firstValueFrom(gateway.fetchCurrentUser()))).toEqual(user);
  });

  it('rejects the disabled demo account', async () => {
    const result = firstValueFrom(
      gateway.login({ email: 'disabled@ksiracare.com', password: 'password123' }),
    );
    // Attach the assertion before advancing time, so the rejection is never unhandled.
    const assertion = expect(result).rejects.toMatchObject({ code: 'account-disabled' });
    await vi.runAllTimersAsync();

    await assertion;
  });

  it('forgets the session on logout', async () => {
    await settle(
      firstValueFrom(gateway.login({ email: 'therapist@ksiracare.com', password: 'password123' })),
    );
    await settle(firstValueFrom(gateway.logout()));

    expect(await settle(firstValueFrom(gateway.fetchCurrentUser()))).toBeNull();
  });
});

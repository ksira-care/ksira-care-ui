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

  it('signs in the demo aapta and remembers the session', async () => {
    const user = await settle(
      firstValueFrom(gateway.login({ email: 'aapta@ksiracare.com', password: 'password123' })),
    );

    expect(user).toMatchObject({ name: 'Aanya Mehta', role: 'aapta' });
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
      firstValueFrom(gateway.login({ email: 'aapta@ksiracare.com', password: 'password123' })),
    );
    await settle(firstValueFrom(gateway.logout()));

    expect(await settle(firstValueFrom(gateway.fetchCurrentUser()))).toBeNull();
  });

  it('signs in the demo admin as an admin', async () => {
    const user = await settle(
      firstValueFrom(gateway.login({ email: 'admin@ksiracare.com', password: 'password123' })),
    );

    expect(user.role).toBe('admin');
  });

  it('changes the password only with the right current one', async () => {
    await settle(firstValueFrom(gateway.login({ email: 'aapta@ksiracare.com', password: 'password123' })));

    const wrong = firstValueFrom(gateway.changePassword({ currentPassword: 'nope', newPassword: 'new-password' }));
    const assertion = expect(wrong).rejects.toMatchObject({ code: 'current-password-incorrect' });
    await vi.runAllTimersAsync();
    await assertion;

    await settle(firstValueFrom(gateway.changePassword({ currentPassword: 'password123', newPassword: 'new-password' })));
    await settle(firstValueFrom(gateway.logout()));
    const user = await settle(
      firstValueFrom(gateway.login({ email: 'aapta@ksiracare.com', password: 'new-password' })),
    );
    expect(user.email).toBe('aapta@ksiracare.com');
  });
});

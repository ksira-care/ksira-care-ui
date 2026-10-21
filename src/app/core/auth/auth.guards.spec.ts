import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanMatchFn, Router, UrlTree, provideRouter } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { redirectSignedIn, requireRole } from './auth.guards';
import { AuthenticatedUser } from './auth.models';
import { AuthService } from './auth.service';

const AAPTA: AuthenticatedUser = { id: 'ap_1', name: 'Aanya Mehta', email: 'a@k.com', role: 'aapta' };
const ADMIN: AuthenticatedUser = { id: 'ad_1', name: 'Meera Iyer', email: 'm@k.com', role: 'admin' };

describe('auth guards', () => {
  function run(guard: CanMatchFn, user: AuthenticatedUser | null): Promise<boolean | string> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: signal(user), restoreSession: () => of(!!user) } },
      ],
    });
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => guard({}, [], undefined as never)) as Observable<boolean | UrlTree>;
    return firstValueFrom(result).then((r) => (r instanceof UrlTree ? router.serializeUrl(r) : r));
  }

  describe('requireRole', () => {
    it('lets in a user of that role', async () => {
      expect(await run(requireRole('aapta'), AAPTA)).toBe(true);
    });

    it("sends someone signed in with the other role to their own portal", async () => {
      expect(await run(requireRole('aapta'), ADMIN)).toBe('/admin');
      expect(await run(requireRole('admin'), AAPTA)).toBe('/aapta');
    });

    it('sends a signed-out visitor to sign in', async () => {
      expect(await run(requireRole('admin'), null)).toMatch(/^\/login/);
    });
  });

  describe('redirectSignedIn', () => {
    it('shows the sign-in page to a signed-out visitor', async () => {
      expect(await run(redirectSignedIn, null)).toBe(true);
    });

    it('sends a signed-in user to their portal', async () => {
      expect(await run(redirectSignedIn, ADMIN)).toBe('/admin');
    });
  });
});

import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { LOGIN_PATH, homeFor } from './auth-paths';
import { Role } from './auth.models';
import { AuthService } from './auth.service';

/**
 * Lets a portal's routes match only for a signed-in user of that `role`.
 * Signed-out visitors go to the login page, which returns them here
 * afterwards; someone signed in with the other role goes to their own portal.
 * Using `canMatch` means portal code isn't even downloaded for anyone else.
 */
export function requireRole(role: Role): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const attemptedUrl = router.currentNavigation()?.extractedUrl.toString();

    return auth.restoreSession().pipe(
      map(() => {
        const user = auth.user();
        if (user?.role === role) return true;
        if (user) return router.parseUrl(homeFor(user.role));
        return router.createUrlTree([LOGIN_PATH], { queryParams: { returnUrl: attemptedUrl } });
      }),
    );
  };
}

/** Keeps signed-in users off the login page. */
export const redirectSignedIn: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.restoreSession().pipe(
    map(() => {
      const user = auth.user();
      return user ? router.parseUrl(homeFor(user.role)) : true;
    }),
  );
};

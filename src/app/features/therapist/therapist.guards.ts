import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { TherapistPaths } from './therapist-paths';

/**
 * Lets the route match only for a signed-in therapist; everyone else goes to
 * the login page, which returns them here afterwards. Using `canMatch` means
 * portal code isn't even downloaded for signed-out visitors.
 */
export const requireTherapistSession: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const attemptedUrl = router.currentNavigation()?.extractedUrl.toString();

  return auth.restoreSession().pipe(
    map(
      (isSignedIn) =>
        isSignedIn ||
        router.createUrlTree([TherapistPaths.login], {
          queryParams: { returnUrl: attemptedUrl },
        }),
    ),
  );
};

/** Keeps signed-in therapists off the login page. */
export const redirectSignedInTherapist: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth
    .restoreSession()
    .pipe(map((isSignedIn) => (isSignedIn ? router.createUrlTree([TherapistPaths.home]) : true)));
};

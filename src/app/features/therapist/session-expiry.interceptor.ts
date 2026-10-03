import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { EXPECTS_UNAUTHENTICATED } from '../../core/auth/auth-http-context';
import { AuthService } from '../../core/auth/auth.service';
import { SESSION_EXPIRED_REASON, TherapistPaths } from './therapist-paths';

/**
 * Sessions last two hours with no refresh. When any portal API call comes
 * back 401, the session has ended: send the therapist to sign in again and
 * bring them back to the page they were on afterwards.
 */
export const sessionExpiryInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      const sessionEnded =
        error instanceof HttpErrorResponse &&
        error.status === HttpStatusCode.Unauthorized &&
        !req.context.get(EXPECTS_UNAUTHENTICATED);

      if (sessionEnded && auth.isAuthenticated()) {
        auth.expireSession();
        void router.navigate([TherapistPaths.login], {
          queryParams: { reason: SESSION_EXPIRED_REASON, returnUrl: router.url },
        });
      }
      return throwError(() => error);
    }),
  );
};

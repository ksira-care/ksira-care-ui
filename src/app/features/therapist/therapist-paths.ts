export const TherapistPaths = {
  home: '/therapist',
  login: '/therapist/login',
  availability: '/therapist/availability',
  bookings: '/therapist/bookings',
  profile: '/therapist/profile',
} as const;

/** `?reason=` value telling the login page why the therapist was sent there. */
export const SESSION_EXPIRED_REASON = 'session-expired';

/**
 * Only allows post-login redirects back into the portal, so a crafted
 * `?returnUrl=` can't send a therapist to another site or page.
 */
export function safeReturnUrl(url: string | null): string {
  const isInsidePortal =
    !!url && (url === TherapistPaths.home || url.startsWith(`${TherapistPaths.home}/`));
  const isLoginPage = !!url && url.startsWith(TherapistPaths.login);
  return isInsidePortal && !isLoginPage ? url : TherapistPaths.home;
}

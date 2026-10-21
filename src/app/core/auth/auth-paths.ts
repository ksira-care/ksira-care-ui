import { Role } from './auth.models';

/** The one sign-in page, for aaptas and admins alike. */
export const LOGIN_PATH = '/login';

/** `?reason=` value telling the login page why the user was sent there. */
export const SESSION_EXPIRED_REASON = 'session-expired';

const HOME_BY_ROLE: Readonly<Record<Role, string>> = {
  aapta: '/aapta',
  admin: '/admin',
};

/** Where each role's portal starts. */
export function homeFor(role: Role): string {
  return HOME_BY_ROLE[role];
}

/**
 * Only allows post-login redirects back into the user's own portal, so a
 * crafted `?returnUrl=` can't send them to another site, or an admin into the
 * aapta portal.
 */
export function safeReturnUrl(url: string | null, role: Role): string {
  const home = homeFor(role);
  const isInsidePortal = !!url && (url === home || url.startsWith(`${home}/`) || url.startsWith(`${home}?`));
  return isInsidePortal ? url : home;
}

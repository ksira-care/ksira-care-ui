import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Marks requests whose 401 is an expected answer (wrong password, "no
 * session yet") rather than a session that expired mid-use.
 */
export const EXPECTS_UNAUTHENTICATED = new HttpContextToken<boolean>(() => false);

export const expectsUnauthenticated = () => new HttpContext().set(EXPECTS_UNAUTHENTICATED, true);

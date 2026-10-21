import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { Routes } from '@angular/router';
import { redirectSignedIn, requireRole } from './core/auth/auth.guards';
import { AuthService } from './core/auth/auth.service';
import { sessionExpiryInterceptor } from './core/auth/session-expiry.interceptor';
import { provideCoreApi } from './core/core-api.providers';
import { apiCredentialsInterceptor } from './core/http/api-credentials.interceptor';

/**
 * Sign-in and the portals. HTTP, the session and the API gateways are provided
 * here rather than at the root, so none of it ships with, or runs on, the
 * public site; one session is shared by the sign-in page and every portal.
 */
export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideHttpClient(
        withFetch(),
        withInterceptors([apiCredentialsInterceptor, sessionExpiryInterceptor]),
      ),
      provideCoreApi(),
      AuthService,
    ],
    children: [
      {
        path: 'login',
        canMatch: [redirectSignedIn],
        loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
        title: 'Sign In — Ksira Care',
      },
      {
        path: 'aapta',
        canMatch: [requireRole('aapta')],
        loadChildren: () => import('./features/aapta/aapta.routes').then((m) => m.AAPTA_ROUTES),
      },
      {
        path: 'admin',
        canMatch: [requireRole('admin')],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
];

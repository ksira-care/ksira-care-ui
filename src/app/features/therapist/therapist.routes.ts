import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { Routes } from '@angular/router';
import { apiCredentialsInterceptor } from '../../core/http/api-credentials.interceptor';
import { AuthService } from '../../core/auth/auth.service';
import { sessionExpiryInterceptor } from './session-expiry.interceptor';
import { provideTherapistApi } from './therapist-api.providers';
import { redirectSignedInTherapist, requireTherapistSession } from './therapist.guards';
import { confirmLeavingUnsavedChanges } from './unsaved-changes.guard';

/**
 * Therapist portal. HTTP, auth and the API gateways are provided here rather
 * than at the root, so none of it ships with, or runs on, the public site.
 */
export const THERAPIST_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideHttpClient(
        withFetch(),
        withInterceptors([apiCredentialsInterceptor, sessionExpiryInterceptor]),
      ),
      provideTherapistApi(),
      AuthService,
    ],
    children: [
      {
        path: 'login',
        canMatch: [redirectSignedInTherapist],
        loadComponent: () =>
          import('./login/login.component').then((m) => m.LoginComponent),
        title: 'Therapist Sign In — Ksira Care',
      },
      {
        // Every signed-in page renders inside the portal shell.
        path: '',
        canMatch: [requireTherapistSession],
        loadComponent: () =>
          import('./layout/portal-layout.component').then((m) => m.PortalLayoutComponent),
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
            title: 'Dashboard — Ksira Care',
          },
          {
            path: 'availability',
            canDeactivate: [confirmLeavingUnsavedChanges],
            loadComponent: () =>
              import('./availability/availability-page.component').then(
                (m) => m.AvailabilityPageComponent,
              ),
            title: 'Availability — Ksira Care',
          },
          {
            path: 'bookings',
            loadComponent: () =>
              import('./bookings/bookings-page.component').then((m) => m.BookingsPageComponent),
            title: 'Bookings — Ksira Care',
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./profile/profile-page.component').then((m) => m.ProfilePageComponent),
            title: 'Your profile — Ksira Care',
          },
        ],
      },
    ],
  },
];

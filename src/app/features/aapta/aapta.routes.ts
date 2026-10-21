import { Routes } from '@angular/router';
import { confirmLeavingUnsavedChanges } from '../../core/navigation/unsaved-changes.guard';
import { provideAaptaApi } from './aapta-api.providers';

/** The aapta portal (`/aapta`). Only matched for a signed-in aapta (see portals.routes.ts). */
export const AAPTA_ROUTES: Routes = [
  {
    // Every page renders inside the portal shell.
    path: '',
    providers: [provideAaptaApi()],
    loadComponent: () =>
      import('./layout/aapta-layout.component').then((m) => m.AaptaLayoutComponent),
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
        canDeactivate: [confirmLeavingUnsavedChanges],
        loadComponent: () =>
          import('./profile/profile-page.component').then((m) => m.ProfilePageComponent),
        title: 'Your profile — Ksira Care',
      },
    ],
  },
];

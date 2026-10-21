import { Routes } from '@angular/router';
import { provideAdminApi } from './admin-api.providers';

/** The admin console (`/admin`). Only matched for a signed-in admin (see portals.routes.ts). */
export const ADMIN_ROUTES: Routes = [
  {
    // Every page renders inside the portal shell.
    path: '',
    providers: [provideAdminApi()],
    loadComponent: () =>
      import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./today/today-page.component').then((m) => m.TodayPageComponent),
        title: 'Today — Ksira Care admin',
      },
      {
        path: 'availability',
        loadComponent: () =>
          import('./availability/availability-overview-page.component').then(
            (m) => m.AvailabilityOverviewPageComponent,
          ),
        title: 'Availability — Ksira Care admin',
      },
      {
        path: 'aaptas',
        loadComponent: () => import('./aaptas/aaptas-page.component').then((m) => m.AaptasPageComponent),
        title: 'Aaptas — Ksira Care admin',
      },
      {
        path: 'history',
        loadComponent: () => import('./history/history-page.component').then((m) => m.HistoryPageComponent),
        title: 'History — Ksira Care admin',
      },
      {
        path: 'account',
        loadComponent: () =>
          import('./account/account-page.component').then((m) => m.AccountPageComponent),
        title: 'Your account — Ksira Care admin',
      },
    ],
  },
];

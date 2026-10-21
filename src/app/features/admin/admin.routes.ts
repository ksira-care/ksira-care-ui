import { Routes } from '@angular/router';

/** The admin console (`/admin`). Only matched for a signed-in admin (see portals.routes.ts). */
export const ADMIN_ROUTES: Routes = [
  {
    // Every page renders inside the portal shell.
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      // The console's pages arrive one by one; until Today exists, start at the account page.
      { path: '', pathMatch: 'full', redirectTo: 'account' },
      {
        path: 'account',
        loadComponent: () =>
          import('./account/account-page.component').then((m) => m.AccountPageComponent),
        title: 'Your account — Ksira Care',
      },
    ],
  },
];

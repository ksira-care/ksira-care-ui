import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';

/** First URL segments served by the signed-in part of the app (see portals.routes.ts). */
const PORTAL_AREAS: ReadonlySet<string> = new Set(['login', 'aapta', 'admin']);

/**
 * Matches the sign-in page and the portals without consuming the URL, so their
 * routes still see `/login`, `/aapta/…`, `/admin/…`. Kept here, not in portals.routes.ts,
 * so the public site's bundle doesn't pull in the portals.
 */
export function matchPortals(segments: UrlSegment[]): UrlMatchResult | null {
  return segments.length > 0 && PORTAL_AREAS.has(segments[0].path) ? { consumed: [] } : null;
}

export const routes: Routes = [
  {
    // Sign-in and the portals — direct-link only, never linked from the public site.
    matcher: matchPortals,
    loadChildren: () => import('./portals.routes').then((m) => m.PORTAL_ROUTES),
  },
  // The aapta portal used to be the "therapist" portal; keep old links and bookmarks working.
  { path: 'therapist/login', redirectTo: '/login' },
  { path: 'therapist', pathMatch: 'full', redirectTo: '/aapta' },
  { path: 'therapist/:page', redirectTo: '/aapta/:page' },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
        title: 'Ksira Care — Someone to talk to, any day',
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./pages/about/about.component').then((m) => m.AboutComponent),
        title: 'About Us — Ksira Care',
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./pages/services/services.component').then((m) => m.ServicesComponent),
        title: 'Our Services — Ksira Care',
      },
      {
        path: 'book',
        loadComponent: () =>
          import('./pages/book/book.component').then((m) => m.BookComponent),
        title: 'Book a Session — Ksira Care',
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./pages/privacy/privacy.component').then((m) => m.PrivacyComponent),
        title: 'Privacy Policy — Ksira Care',
      },
      {
        path: 'terms',
        loadComponent: () =>
          import('./pages/terms/terms.component').then((m) => m.TermsComponent),
        title: 'Terms of Service — Ksira Care',
      },
      {
        path: '**',
        loadComponent: () =>
          import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
        title: 'Page Not Found — Ksira Care',
      },
    ],
  },
];

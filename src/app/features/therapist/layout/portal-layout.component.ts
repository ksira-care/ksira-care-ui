import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { excludeFromSearchIndex } from '../../../core/seo/exclude-from-search-index';
import { BrandLogoComponent } from '../../../shared/brand-logo/brand-logo.component';
import { TherapistPaths } from '../therapist-paths';
import { AccountMenuComponent } from './account-menu.component';

interface PortalNavItem {
  readonly label: string;
  readonly path: string;
  readonly exact: boolean;
}

/**
 * Sections appear here as they ship — linking to pages that don't exist yet
 * would only send therapists to dead ends.
 */
const NAV_ITEMS: readonly PortalNavItem[] = [
  { label: 'Dashboard', path: TherapistPaths.home, exact: true },
  { label: 'Availability', path: TherapistPaths.availability, exact: false },
  { label: 'Bookings', path: TherapistPaths.bookings, exact: false },
  { label: 'Profile', path: TherapistPaths.profile, exact: false },
];

/** Shell for every signed-in portal page: header, navigation and account menu. */
@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandLogoComponent, AccountMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="portal-header">
      <div class="container portal-header__inner">
        <a [routerLink]="homePath" class="portal-header__brand" aria-label="Ksira Care – Dashboard">
          <app-brand-logo />
        </a>

        <nav class="portal-header__nav" aria-label="Portal">
          <ul role="list" class="portal-header__links">
            @for (item of navItems; track item.path) {
              <li>
                <a
                  class="portal-header__link"
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  ariaCurrentWhenActive="page"
                  [routerLinkActiveOptions]="{ exact: item.exact }"
                >{{ item.label }}</a>
              </li>
            }
          </ul>
        </nav>

        @if (auth.user(); as user) {
          <app-account-menu
            class="portal-header__account"
            [name]="user.name"
            [email]="user.email"
            [signingOut]="signingOut()"
            [profilePath]="profilePath"
            (signOut)="signOut()"
          />
        }
      </div>
    </header>

    <main id="main-content" class="container">
      <router-outlet />
    </main>
  `,
  styles: `
    :host { display: block; }

    .portal-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background-color: rgba(255, 255, 255, 0.92);
      -webkit-backdrop-filter: blur(14px) saturate(1.4);
      backdrop-filter: blur(14px) saturate(1.4);
      border-bottom: 1px solid var(--color-border-nav);
    }

    .portal-header__inner {
      display: grid;
      grid-template-columns: auto 1fr auto;
      grid-template-areas: 'brand nav account';
      align-items: center;
      column-gap: var(--space-xl);
      min-height: var(--nav-height);

      @media (max-width: 640px) {
        grid-template-columns: 1fr auto;
        grid-template-areas:
          'brand account'
          'nav nav';
        row-gap: var(--space-xs);
        padding-top: var(--space-sm);
      }
    }

    .portal-header__brand {
      grid-area: brand;

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 3px;
        border-radius: var(--radius-sm);
      }
    }

    .portal-header__nav {
      grid-area: nav;
      align-self: stretch;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .portal-header__links {
      display: flex;
      height: 100%;
      gap: var(--space-lg);
    }

    .portal-header__link {
      display: flex;
      align-items: center;
      height: 100%;
      min-height: 44px;
      border-bottom: 2px solid transparent;
      font-size: 0.9375rem;
      color: var(--color-text-muted);
      white-space: nowrap;
      transition: color var(--transition), border-color var(--transition);

      &:hover { color: var(--color-text); }

      &.active {
        color: var(--color-text);
        font-weight: 600;
        border-bottom-color: var(--color-green);
      }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: -2px;
      }
    }

    .portal-header__account { grid-area: account; }
  `,
})
export class PortalLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly homePath = TherapistPaths.home;
  protected readonly profilePath = TherapistPaths.profile;
  protected readonly navItems = NAV_ITEMS;
  protected readonly signingOut = signal(false);

  constructor() {
    excludeFromSearchIndex();
  }

  protected signOut(): void {
    this.signingOut.set(true);
    this.auth
      .logout()
      .pipe(finalize(() => this.signingOut.set(false)))
      .subscribe(() => void this.router.navigateByUrl(TherapistPaths.login));
  }

}

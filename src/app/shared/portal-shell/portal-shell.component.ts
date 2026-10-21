import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { LOGIN_PATH } from '../../core/auth/auth-paths';
import { AuthService } from '../../core/auth/auth.service';
import { excludeFromSearchIndex } from '../../core/seo/exclude-from-search-index';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';
import { AccountMenuComponent } from '../ui/account-menu.component';

export interface PortalNavItem {
  readonly label: string;
  readonly path: string;
  /** Active only on this exact URL (for a portal's home), not its sub-pages. */
  readonly exact?: boolean;
}

/**
 * Shell for every signed-in page of a portal: header, navigation and account
 * menu, with the page rendered below. Each portal passes its own sections.
 */
@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandLogoComponent, AccountMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="portal-header">
      <div class="container portal-header__inner">
        <a [routerLink]="homePath()" class="portal-header__brand" [attr.aria-label]="'Ksira Care – ' + homeLabel()">
          <app-brand-logo />
        </a>

        <nav class="portal-header__nav" aria-label="Portal">
          <ul role="list" class="portal-header__links">
            @for (item of navItems(); track item.path) {
              <li>
                <a
                  class="portal-header__link"
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  ariaCurrentWhenActive="page"
                  [routerLinkActiveOptions]="{ exact: !!item.exact }"
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
            [profilePath]="profilePath()"
            [profileLabel]="profileLabel()"
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
      background-color: var(--color-glass-strong);
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
export class PortalShellComponent {
  readonly navItems = input.required<readonly PortalNavItem[]>();
  readonly homePath = input.required<string>();
  /** What the logo link goes to, for screen readers, e.g. "Dashboard". */
  readonly homeLabel = input.required<string>();
  /** The account menu's link to the user's own details. */
  readonly profilePath = input.required<string>();
  readonly profileLabel = input('Your profile');

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly signingOut = signal(false);

  constructor() {
    excludeFromSearchIndex();
  }

  protected signOut(): void {
    this.signingOut.set(true);
    this.auth
      .logout()
      .pipe(finalize(() => this.signingOut.set(false)))
      .subscribe(() => void this.router.navigateByUrl(LOGIN_PATH));
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PortalNavItem, PortalShellComponent } from '../../../shared/portal-shell/portal-shell.component';
import { AdminPaths } from '../admin-paths';

/**
 * Sections appear here as they ship — linking to pages that don't exist yet
 * would only send admins to dead ends.
 */
const NAV_ITEMS: readonly PortalNavItem[] = [{ label: 'Account', path: AdminPaths.account }];

/** The admin console's shell around every signed-in page. */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [PortalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-portal-shell
      [navItems]="navItems"
      [homePath]="paths.home"
      homeLabel="Admin console"
      [profilePath]="paths.account"
      profileLabel="Your account"
    />
  `,
})
export class AdminLayoutComponent {
  protected readonly navItems = NAV_ITEMS;
  protected readonly paths = AdminPaths;
}

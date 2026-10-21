import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PortalNavItem, PortalShellComponent } from '../../../shared/portal-shell/portal-shell.component';
import { AdminPaths } from '../admin-paths';

/** The console's sections, in the order an admin's day runs. Account lives in the avatar menu. */
const NAV_ITEMS: readonly PortalNavItem[] = [
  { label: 'Today', path: AdminPaths.home, exact: true },
  { label: 'Availability', path: AdminPaths.availability },
  { label: 'Aaptas', path: AdminPaths.aaptas },
  { label: 'History', path: AdminPaths.history },
];

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
      homeLabel="Today"
      [profilePath]="paths.account"
      profileLabel="Your account"
    />
  `,
})
export class AdminLayoutComponent {
  protected readonly navItems = NAV_ITEMS;
  protected readonly paths = AdminPaths;
}

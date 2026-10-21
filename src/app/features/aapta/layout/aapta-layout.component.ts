import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PortalNavItem, PortalShellComponent } from '../../../shared/portal-shell/portal-shell.component';
import { AaptaPaths } from '../aapta-paths';

/**
 * Sections appear here as they ship — linking to pages that don't exist yet
 * would only send aaptas to dead ends.
 */
const NAV_ITEMS: readonly PortalNavItem[] = [
  { label: 'Dashboard', path: AaptaPaths.home, exact: true },
  { label: 'Availability', path: AaptaPaths.availability },
  { label: 'Bookings', path: AaptaPaths.bookings },
  { label: 'Profile', path: AaptaPaths.profile },
];

/** The aapta portal's shell around every signed-in page. */
@Component({
  selector: 'app-aapta-layout',
  standalone: true,
  imports: [PortalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-portal-shell
      [navItems]="navItems"
      [homePath]="paths.home"
      homeLabel="Dashboard"
      [profilePath]="paths.profile"
    />
  `,
})
export class AaptaLayoutComponent {
  protected readonly navItems = NAV_ITEMS;
  protected readonly paths = AaptaPaths;
}

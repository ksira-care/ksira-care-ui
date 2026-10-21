import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationWaitComponent } from './shared/ui/navigation-wait.component';

/**
 * Root shell. Each area of the app (public site, portals) brings its own
 * layout through the router; a slow navigation shows that it's on its way.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavigationWaitComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet /><app-navigation-wait />`,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class App {}

import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import {
  WelcomePopupComponent,
} from './shared/welcome-popup/welcome-popup.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, WelcomePopupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Welcome popup — rendered only when showPopup() is true.
         @if keeps it fully out of the DOM once dismissed,
         which is good for both performance and accessibility
         (no hidden dialog lingering in the accessibility tree). -->
    @if (showPopup()) {
      <app-welcome-popup (closed)="onPopupClose()" />
    }

    <app-navbar />
    <main id="main-content" [attr.inert]="showPopup() ? '' : null">
      <router-outlet />
    </main>
    <app-footer [attr.inert]="showPopup() ? '' : null" />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class App implements OnInit {
  protected readonly showPopup = signal(false);

  ngOnInit(): void {
    // Defer by one microtask so the page renders first,
    // then the popup animates in smoothly.
    queueMicrotask(() => {
      this.showPopup.set(WelcomePopupComponent.shouldShow());
    });
  }

  protected onPopupClose(): void {
    this.showPopup.set(false);
  }
}

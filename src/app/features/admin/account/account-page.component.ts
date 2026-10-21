import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ChangePasswordFormComponent } from '../../../shared/account/change-password-form.component';

/** Who is signed in, and where they change their password. */
@Component({
  selector: 'app-admin-account-page',
  standalone: true,
  imports: [ChangePasswordFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="account__header">
      <h1 class="section-title account__title">Your account</h1>
      @if (auth.user(); as user) {
        <p class="account__intro">Signed in as {{ user.name }} · {{ user.email }}</p>
      }
    </header>

    <section class="card" aria-labelledby="password-heading">
      <div class="card__header">
        <h2 class="card__title" id="password-heading">Password</h2>
      </div>
      <app-change-password-form />
    </section>
  `,
  styles: `
    :host {
      display: block;
      max-width: 52rem;
      padding-block: var(--space-2xl);
    }

    .account__header { margin-bottom: var(--space-xl); }
    .account__title { margin-bottom: var(--space-xs); }
    .account__intro { color: var(--color-text-muted); overflow-wrap: anywhere; }
  `,
})
export class AccountPageComponent {
  protected readonly auth = inject(AuthService);
}

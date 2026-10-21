import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { excludeFromSearchIndex } from '../../core/seo/exclude-from-search-index';
import { BrandLogoComponent } from '../../shared/brand-logo/brand-logo.component';
import { SESSION_EXPIRED_REASON, safeReturnUrl } from '../../core/auth/auth-paths';
import { PasswordFieldComponent } from '../../shared/ui/password-field.component';
import { loginErrorMessage } from './login-error-message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, BrandLogoComponent, PasswordFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main-content" class="login">
      <div class="login__panel">
        <app-brand-logo size="lg" class="login__logo" />

        <span class="section-label">Ksira Care team</span>
        <h1 class="section-title login__title">Welcome back.</h1>
        <p class="login__intro">Sign in to your Ksira Care account.</p>

        @if (sessionExpired) {
          <p class="notice login__notice" data-tone="success" role="status">
            Your session has expired. Please sign in again.
          </p>
        }

        <form class="login__form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="form-group">
            <label for="login-email" class="form-label">Email</label>
            <input
              #emailInput
              id="login-email"
              type="email"
              class="form-control"
              formControlName="email"
              autocomplete="username"
              inputmode="email"
              autocapitalize="none"
              spellcheck="false"
              placeholder="you@ksiracare.com"
              [class.invalid]="showError('email')"
              [attr.aria-invalid]="showError('email')"
              [attr.aria-describedby]="showError('email') ? 'login-email-error' : null"
            />
            @if (showError('email')) {
              <p id="login-email-error" class="form-error">{{ emailError() }}</p>
            }
          </div>

          <div class="form-group">
            <label for="login-password" class="form-label">Password</label>
            <app-password-field
              #passwordField
              inputId="login-password"
              formControlName="password"
              autocomplete="current-password"
              [invalid]="showError('password')"
              [describedBy]="showError('password') ? 'login-password-error' : null"
            />
            @if (showError('password')) {
              <p id="login-password-error" class="form-error">Enter your password.</p>
            }
          </div>

          <!-- Always in the DOM so screen readers reliably announce new messages. -->
          <div class="login__alert" role="alert">
            @if (errorMessage(); as message) {
              <p class="notice" data-tone="error">{{ message }}</p>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary login__submit"
            [disabled]="submitting()"
            [attr.aria-busy]="submitting()"
          >
            @if (submitting()) {
              <span class="spinner" aria-hidden="true"></span>
              Signing in…
            } @else {
              Sign in
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            }
          </button>
        </form>

        <p class="login__footnote">
          Accounts are created by an admin.<br />
          Contact your coordinator for access.
        </p>
      </div>
    </main>
  `,
  styles: `
    .login {
      display: grid;
      place-items: center;
      min-height: 100dvh;
      padding: var(--space-2xl) var(--space-md);
    }

    .login__panel {
      width: 100%;
      max-width: 400px;
      text-align: center;
    }

    .login__logo { margin-bottom: var(--space-xl); }

    .login__title { margin-bottom: var(--space-sm); }

    .login__intro {
      color: var(--color-text-muted);
      margin-bottom: var(--space-xl);
    }

    .login__notice { margin-bottom: var(--space-lg); }

    .login__form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      text-align: left;
    }

    .login__alert:empty { display: none; }

    .login__submit {
      width: 100%;
      padding: 0.875rem;
      font-size: 1rem;
    }

    .login__footnote {
      margin-top: var(--space-xl);
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly emailInput = viewChild.required<ElementRef<HTMLInputElement>>('emailInput');
  private readonly passwordField = viewChild.required<PasswordFieldComponent>('passwordField');

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly sessionExpired =
    this.route.snapshot.queryParamMap.get('reason') === SESSION_EXPIRED_REASON;
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    excludeFromSearchIndex();

    // A stale "incorrect password" message is confusing once the user edits.
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.errorMessage.set(null));
  }

  protected showError(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  protected emailError(): string {
    return this.form.controls.email.hasError('required')
      ? 'Enter your email address.'
      : 'Enter a valid email address.';
  }

  protected submit(): void {
    if (this.submitting()) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.submitting.set(true);

    this.auth
      .login({ email: email.trim(), password })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        // Aaptas and admins sign in here alike; each goes on to their own portal.
        next: (user) => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(safeReturnUrl(returnUrl, user.role));
        },
        error: (error: unknown) => {
          // emitEvent: false — otherwise valueChanges would clear the message we're about to show.
          this.form.controls.password.reset('', { emitEvent: false });
          this.errorMessage.set(loginErrorMessage(error));
          this.passwordField().focus();
        },
      });
  }

  private focusFirstInvalidField(): void {
    if (this.form.controls.email.invalid) this.emailInput().nativeElement.focus();
    else this.passwordField().focus();
  }
}

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
import { AuthService } from '../../../core/auth/auth.service';
import { excludeFromSearchIndex } from '../../../core/seo/exclude-from-search-index';
import { BrandLogoComponent } from '../../../shared/brand-logo/brand-logo.component';
import { SESSION_EXPIRED_REASON, safeReturnUrl } from '../therapist-paths';
import { loginErrorMessage } from './login-error-message';

@Component({
  selector: 'app-therapist-login',
  standalone: true,
  imports: [ReactiveFormsModule, BrandLogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main-content" class="login">
      <div class="login__panel">
        <app-brand-logo size="lg" class="login__logo" />

        <span class="section-label">Therapist portal</span>
        <h1 class="section-title login__title">Welcome back.</h1>
        <p class="login__intro">Sign in to manage your availability and upcoming sessions.</p>

        @if (sessionExpired) {
          <p class="login__notice" role="status">
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
            <div class="password-field">
              <input
                #passwordInput
                id="login-password"
                class="form-control password-field__input"
                formControlName="password"
                autocomplete="current-password"
                [type]="passwordVisible() ? 'text' : 'password'"
                [class.invalid]="showError('password')"
                [attr.aria-invalid]="showError('password')"
                [attr.aria-describedby]="showError('password') ? 'login-password-error' : null"
              />
              <button
                type="button"
                class="password-field__toggle"
                aria-label="Show password"
                aria-controls="login-password"
                [attr.aria-pressed]="passwordVisible()"
                (click)="passwordVisible.set(!passwordVisible())"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  @if (passwordVisible()) {
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                    <line x1="2" y1="2" x2="22" y2="22"/>
                  } @else {
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  }
                </svg>
              </button>
            </div>
            @if (showError('password')) {
              <p id="login-password-error" class="form-error">Enter your password.</p>
            }
          </div>

          <!-- Always in the DOM so screen readers reliably announce new messages. -->
          <div class="login__alert" role="alert">
            @if (errorMessage(); as message) {
              <p class="login__alert-text">{{ message }}</p>
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

    .login__notice {
      margin-bottom: var(--space-lg);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      background-color: var(--color-green-light);
      color: var(--color-green);
      font-size: 0.9375rem;
    }

    .login__form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      text-align: left;
    }

    .password-field {
      position: relative;
    }

    .password-field__input { padding-right: 2.75rem; }

    .password-field__toggle {
      position: absolute;
      top: 50%;
      right: 0.375rem;
      transform: translateY(-50%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      transition: color var(--transition);

      &:hover { color: var(--color-text); }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 0;
      }
    }

    .login__alert:empty { display: none; }

    .login__alert-text {
      padding: 0.75rem 1rem;
      border: 1px solid var(--color-danger-border);
      border-radius: var(--radius-md);
      background-color: var(--color-danger-bg);
      color: var(--color-danger);
      font-size: 0.9375rem;
    }

    .login__submit {
      width: 100%;
      padding: 0.875rem;
      font-size: 1rem;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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
  private readonly passwordInput =
    viewChild.required<ElementRef<HTMLInputElement>>('passwordInput');

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly sessionExpired =
    this.route.snapshot.queryParamMap.get('reason') === SESSION_EXPIRED_REASON;
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly passwordVisible = signal(false);

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
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(safeReturnUrl(returnUrl));
        },
        error: (error: unknown) => {
          // emitEvent: false — otherwise valueChanges would clear the message we're about to show.
          this.form.controls.password.reset('', { emitEvent: false });
          this.errorMessage.set(loginErrorMessage(error));
          this.passwordInput().nativeElement.focus();
        },
      });
  }

  private focusFirstInvalidField(): void {
    const target = this.form.controls.email.invalid ? this.emailInput() : this.passwordInput();
    target.nativeElement.focus();
  }
}

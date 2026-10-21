import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PASSWORD_LENGTH, PasswordChangeError } from '../../core/auth/auth.models';
import { PasswordFieldComponent } from '../ui/password-field.component';

type Field = 'currentPassword' | 'newPassword' | 'confirmPassword';

function matchesNewPassword(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.parent?.get('newPassword')?.value;
  return control.value && control.value !== newPassword ? { mismatch: true } : null;
}

/**
 * Lets the signed-in user — aapta or admin — change their password. The
 * server signs them out on every other device; this one stays signed in.
 */
@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [ReactiveFormsModule, PasswordFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="password-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="form-group">
        <label for="current-password" class="form-label">Current password</label>
        <app-password-field
          #currentField
          inputId="current-password"
          formControlName="currentPassword"
          autocomplete="current-password"
          [invalid]="!!errorFor('currentPassword')"
          [describedBy]="errorFor('currentPassword') ? 'current-password-error' : null"
        />
        @if (errorFor('currentPassword'); as error) {
          <p id="current-password-error" class="form-error">{{ error }}</p>
        }
      </div>

      <div class="form-group">
        <label for="new-password" class="form-label">New password</label>
        <app-password-field
          inputId="new-password"
          formControlName="newPassword"
          autocomplete="new-password"
          [invalid]="!!errorFor('newPassword')"
          describedBy="new-password-hint"
        />
        <p id="new-password-hint" [class]="errorFor('newPassword') ? 'form-error' : 'password-form__hint'">
          {{ errorFor('newPassword') ?? lengthHint }}
        </p>
      </div>

      <div class="form-group">
        <label for="confirm-password" class="form-label">Confirm new password</label>
        <app-password-field
          inputId="confirm-password"
          formControlName="confirmPassword"
          autocomplete="new-password"
          [invalid]="!!errorFor('confirmPassword')"
          [describedBy]="errorFor('confirmPassword') ? 'confirm-password-error' : null"
        />
        @if (errorFor('confirmPassword'); as error) {
          <p id="confirm-password-error" class="form-error">{{ error }}</p>
        }
      </div>

      <!-- Always in the DOM so screen readers announce the outcome. -->
      <div class="password-form__outcome" role="status" aria-live="polite">
        @if (outcome(); as outcome) {
          <p class="notice" [attr.data-tone]="outcome.tone">{{ outcome.message }}</p>
        }
      </div>

      <div>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Changing…' : 'Change password' }}
        </button>
      </div>
    </form>
  `,
  styles: `
    .password-form {
      display: grid;
      gap: 1.25rem;
      max-width: 26rem;
    }

    .password-form__hint {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .password-form__outcome:empty { display: none; }
  `,
})
export class ChangePasswordFormComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentField = viewChild.required<PasswordFieldComponent>('currentField');

  protected readonly lengthHint = `${PASSWORD_LENGTH.min}–${PASSWORD_LENGTH.max} characters.`;
  protected readonly saving = signal(false);
  protected readonly outcome = signal<{ tone: 'success' | 'error'; message: string } | null>(null);
  /** Set when the server says the current password is wrong. */
  private readonly currentRejected = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    currentPassword: ['', Validators.required],
    newPassword: [
      '',
      [Validators.required, Validators.minLength(PASSWORD_LENGTH.min), Validators.maxLength(PASSWORD_LENGTH.max)],
    ],
    confirmPassword: ['', [Validators.required, matchesNewPassword]],
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.currentRejected.set(false);
      this.outcome.set(null);
    });
    // Re-check the confirmation when the new password changes after it.
    this.form.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: false }));
  }

  protected errorFor(field: Field): string | null {
    if (field === 'currentPassword' && this.currentRejected()) return 'Your current password is incorrect.';
    const control = this.form.controls[field];
    if (!control.touched || control.valid) return null;
    if (control.hasError('required')) {
      return field === 'confirmPassword' ? 'Type the new password again.' : 'Enter a password.';
    }
    if (control.hasError('mismatch')) return "The passwords don't match.";
    return `Use ${this.lengthHint.toLowerCase().replace('.', '')}.`;
  }

  protected submit(): void {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.saving.set(true);
    this.auth
      .changePassword({ currentPassword, newPassword })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.form.reset();
          this.outcome.set({
            tone: 'success',
            message: "Password changed. You've been signed out on your other devices.",
          });
        },
        error: (error: unknown) => {
          if (error instanceof PasswordChangeError && error.code === 'current-password-incorrect') {
            this.currentRejected.set(true);
            this.currentField().focus();
            return;
          }
          const offline = error instanceof PasswordChangeError && error.code === 'network';
          this.outcome.set({
            tone: 'error',
            message: offline
              ? "We couldn't reach the server. Check your connection and try again."
              : "We couldn't change your password. Please try again.",
          });
        },
      });
  }
}

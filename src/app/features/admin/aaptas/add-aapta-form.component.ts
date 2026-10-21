import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PASSWORD_LENGTH } from '../../../core/auth/auth.models';
import { generatePassword } from '../../../core/auth/password-generator';
import { Language } from '../../../core/languages/language.models';
import { LanguagePickerComponent } from '../../../shared/ui/language-picker.component';
import { NewAapta } from './aaptas.models';

const NAME_MAX = 100;

const atLeastOne = (control: { value: readonly string[] }) => (control.value.length ? null : { required: true });

/**
 * "Add an Aapta": the admin sets up the login — name, email, languages and a
 * first password, typed or generated — and shares it with the aapta, who can
 * change the password after signing in.
 */
@Component({
  selector: 'app-add-aapta-form',
  standalone: true,
  imports: [ReactiveFormsModule, LanguagePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="add" [formGroup]="form" (ngSubmit)="submit()" novalidate aria-labelledby="add-aapta-heading">
      <div class="add__grid">
        @for (field of nameFields; track field.name) {
          <div class="form-group">
            <label class="form-label" [for]="'new-' + field.name">
              {{ field.label }}
              @if (field.required) { <span class="required" aria-hidden="true">*</span> }
            </label>
            <input class="form-control" [id]="'new-' + field.name" [formControlName]="field.name"
                   [attr.maxlength]="nameMax" autocomplete="off"
                   [class.invalid]="invalid(field.name)" [attr.aria-invalid]="invalid(field.name)" />
            @if (invalid(field.name)) {
              <p class="form-error">Enter their {{ field.label.toLowerCase() }}.</p>
            }
          </div>
        }

        <div class="form-group add__wide">
          <label class="form-label" for="new-email">Email (their login) <span class="required" aria-hidden="true">*</span></label>
          <input class="form-control" id="new-email" type="email" formControlName="email" autocomplete="off"
                 inputmode="email" autocapitalize="none" spellcheck="false"
                 [class.invalid]="invalid('email')" [attr.aria-invalid]="invalid('email')" />
          @if (invalid('email')) {
            <p class="form-error">Enter a valid email address.</p>
          }
        </div>

        <div class="form-group add__wide">
          <span class="form-label" id="new-languages-label">Languages <span class="required" aria-hidden="true">*</span></span>
          <app-language-picker [languages]="languages()" formControlName="languages" labelledBy="new-languages-label" />
          @if (invalid('languages')) {
            <p class="form-error">Choose at least one language.</p>
          }
        </div>

        <div class="form-group add__wide">
          <label class="form-label" for="new-password">Password you give them <span class="required" aria-hidden="true">*</span></label>
          <div class="add__password">
            <input class="form-control" id="new-password" formControlName="password" autocomplete="new-password"
                   spellcheck="false" [class.invalid]="invalid('password')" [attr.aria-invalid]="invalid('password')"
                   aria-describedby="new-password-hint" />
            <button type="button" class="btn btn-outline btn-sm" (click)="generate()">Generate</button>
          </div>
          <p id="new-password-hint" [class]="invalid('password') ? 'form-error' : 'add__hint'">
            {{ minLength }}–{{ maxLength }} characters. You share it with them yourself; they can change it after signing in.
          </p>
        </div>
      </div>

      @if (error()) {
        <p class="notice" data-tone="error" role="alert">{{ error() }}</p>
      }

      <div class="add__actions">
        <button type="submit" class="btn btn-primary" [disabled]="busy()">{{ busy() ? 'Creating…' : 'Create account' }}</button>
        <button type="button" class="btn btn-ghost" [disabled]="busy()" (click)="cancel.emit()">Cancel</button>
      </div>
    </form>
  `,
  styles: `
    .add { display: grid; gap: var(--space-lg); }

    .add__grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.25rem var(--space-md);

      @media (max-width: 720px) { grid-template-columns: 1fr; }
    }

    .add__wide { grid-column: 1 / -1; }

    .add__password {
      display: flex;
      gap: var(--space-sm);
      max-width: 26rem;
      font-family: ui-monospace, monospace;
    }

    .add__hint { font-size: 0.8125rem; color: var(--color-text-muted); }

    .add__actions { display: flex; align-items: center; gap: var(--space-lg); }
  `,
})
export class AddAaptaFormComponent {
  readonly languages = input.required<readonly Language[]>();
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly create = output<NewAapta>();
  readonly cancel = output<void>();

  protected readonly nameMax = NAME_MAX;
  protected readonly minLength = PASSWORD_LENGTH.min;
  protected readonly maxLength = PASSWORD_LENGTH.max;
  protected readonly nameFields = [
    { name: 'firstName', label: 'First name', required: true },
    { name: 'middleName', label: 'Middle name', required: false },
    { name: 'lastName', label: 'Last name', required: true },
  ] as const;

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.pattern(/\S/)]],
    middleName: [''],
    lastName: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    languages: this.fb.control<readonly string[]>([], atLeastOne),
    password: [generatePassword(), [Validators.required, Validators.minLength(PASSWORD_LENGTH.min), Validators.maxLength(PASSWORD_LENGTH.max)]],
  });

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  protected generate(): void {
    this.form.controls.password.setValue(generatePassword());
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.create.emit({
      firstName: value.firstName.trim(),
      middleName: value.middleName.trim() || null,
      lastName: value.lastName.trim(),
      email: value.email.trim().toLowerCase(),
      languages: value.languages,
      password: value.password,
    });
  }
}

import { ChangeDetectionStrategy, Component, OnInit, inject, input, output } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Language } from '../../../core/languages/language.models';
import { LanguagePickerComponent } from '../../../shared/ui/language-picker.component';
import { portalToday } from '../../../core/time/civil-date';
import { toE164 } from '../../../core/format/phone';
import { AaptaProfile, PROFILE_LIMITS, ProfileChanges } from './profile.models';

type TextField = 'firstName' | 'middleName' | 'lastName' | 'phone' | 'dateOfBirth' | 'address';

const notBlank = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

const phoneNumber = (control: AbstractControl): ValidationErrors | null =>
  control.value && !toE164(control.value) ? { phone: true } : null;

const atLeastOne = (control: AbstractControl): ValidationErrors | null =>
  (control.value as readonly string[]).length === 0 ? { required: true } : null;

const MESSAGES: Readonly<Record<string, string>> = {
  required: 'This is required.',
  maxlength: 'This is too long.',
  phone: 'Enter a phone number, e.g. 98765 43210 or +44 7911 123456.',
  future: "A date of birth can't be in the future.",
};

/**
 * Edits the details an aapta may change themselves: name, phone, date of
 * birth, address and languages. Their email is their login, so only an admin
 * changes it. Emits just the fields that changed.
 */
@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [ReactiveFormsModule, LanguagePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="profile-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="profile-form__grid">
        @for (field of nameFields; track field.name) {
          <div class="form-group">
            <label class="form-label" [for]="'profile-' + field.name">
              {{ field.label }}
              @if (!field.optional) { <span class="required" aria-hidden="true">*</span> }
            </label>
            <input
              class="form-control"
              [id]="'profile-' + field.name"
              [formControlName]="field.name"
              [attr.autocomplete]="field.autocomplete"
              [attr.maxlength]="limits.name"
              [class.invalid]="!!errorFor(field.name)"
              [attr.aria-invalid]="!!errorFor(field.name)"
              [attr.aria-describedby]="errorFor(field.name) ? 'profile-' + field.name + '-error' : null"
            />
            @if (errorFor(field.name); as error) {
              <p class="form-error" [id]="'profile-' + field.name + '-error'">{{ error }}</p>
            }
          </div>
        }

        <div class="form-group">
          <span class="form-label">Email</span>
          <p class="profile-form__static">{{ profile().email }}</p>
          <p class="profile-form__hint">This is how you sign in. To change it, contact your coordinator.</p>
        </div>

        <div class="form-group">
          <label class="form-label" for="profile-phone">Phone</label>
          <input
            class="form-control"
            id="profile-phone"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            placeholder="98765 43210"
            formControlName="phone"
            [class.invalid]="!!errorFor('phone')"
            [attr.aria-invalid]="!!errorFor('phone')"
            aria-describedby="profile-phone-hint"
          />
          <p id="profile-phone-hint" [class]="errorFor('phone') ? 'form-error' : 'profile-form__hint'">
            {{ errorFor('phone') ?? 'Indian numbers can leave out +91.' }}
          </p>
        </div>

        <div class="form-group">
          <label class="form-label" for="profile-dob">Date of birth</label>
          <input
            class="form-control"
            id="profile-dob"
            type="date"
            autocomplete="bday"
            formControlName="dateOfBirth"
            [max]="today"
            [class.invalid]="!!errorFor('dateOfBirth')"
            [attr.aria-invalid]="!!errorFor('dateOfBirth')"
            [attr.aria-describedby]="errorFor('dateOfBirth') ? 'profile-dob-error' : null"
          />
          @if (errorFor('dateOfBirth'); as error) {
            <p class="form-error" id="profile-dob-error">{{ error }}</p>
          }
        </div>

        <div class="form-group profile-form__wide">
          <span class="form-label" id="profile-languages-label">
            Languages you speak <span class="required" aria-hidden="true">*</span>
          </span>
          <app-language-picker
            [languages]="languages()"
            formControlName="languages"
            labelledBy="profile-languages-label"
            [describedBy]="languagesInvalid() ? 'profile-languages-error' : null"
          />
          @if (languagesInvalid()) {
            <p class="form-error" id="profile-languages-error">Choose at least one language.</p>
          }
        </div>

        <div class="form-group profile-form__wide">
          <label class="form-label" for="profile-address">Address</label>
          <textarea
            class="form-control"
            id="profile-address"
            rows="2"
            autocomplete="street-address"
            formControlName="address"
            [attr.maxlength]="limits.address"
            [class.invalid]="!!errorFor('address')"
          ></textarea>
          @if (errorFor('address'); as error) {
            <p class="form-error">{{ error }}</p>
          }
        </div>
      </div>

      <!-- Always in the DOM so screen readers announce a failed save. -->
      <div class="profile-form__alert" role="alert">
        @if (error(); as error) {
          <p class="notice" data-tone="error">{{ error }}</p>
        }
      </div>

      <div class="profile-form__actions">
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Saving…' : 'Save changes' }}
        </button>
        <button type="button" class="btn btn-ghost" [disabled]="saving()" (click)="cancel.emit()">Cancel</button>
      </div>
    </form>
  `,
  styles: `
    .profile-form { display: grid; gap: var(--space-lg); }

    .profile-form__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.25rem var(--space-md);

      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }

    .profile-form__wide { grid-column: 1 / -1; }

    .profile-form__static {
      padding-block: 0.625rem;
      overflow-wrap: anywhere;
      color: var(--color-text);
    }

    .profile-form__hint {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }




    textarea.form-control { resize: vertical; }

    .profile-form__alert:empty { display: none; }

    .profile-form__actions {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
    }
  `,
})
export class ProfileFormComponent implements OnInit {
  readonly profile = input.required<AaptaProfile>();
  readonly languages = input.required<readonly Language[]>();
  readonly saving = input(false);
  /** Why the last save failed, if it did. */
  readonly error = input<string | null>(null);
  readonly save = output<ProfileChanges>();
  readonly cancel = output<void>();

  protected readonly limits = PROFILE_LIMITS;
  protected readonly today = portalToday(new Date());
  protected readonly nameFields = [
    { name: 'firstName', label: 'First name', autocomplete: 'given-name', optional: false },
    { name: 'middleName', label: 'Middle name', autocomplete: 'additional-name', optional: true },
    { name: 'lastName', label: 'Last name', autocomplete: 'family-name', optional: false },
  ] as const;

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, notBlank, Validators.maxLength(PROFILE_LIMITS.name)]],
    middleName: ['', Validators.maxLength(PROFILE_LIMITS.name)],
    lastName: ['', [Validators.required, notBlank, Validators.maxLength(PROFILE_LIMITS.name)]],
    phone: ['', phoneNumber],
    dateOfBirth: ['', (control: AbstractControl) => (control.value > this.today ? { future: true } : null)],
    address: ['', Validators.maxLength(PROFILE_LIMITS.address)],
    languages: this.fb.control<readonly string[]>([], atLeastOne),
  });

  ngOnInit(): void {
    const profile = this.profile();
    this.form.setValue({
      firstName: profile.firstName,
      middleName: profile.middleName ?? '',
      lastName: profile.lastName,
      phone: profile.phone ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
      address: profile.address ?? '',
      languages: profile.languages,
    });
    // A date of birth can be corrected, but not removed once given.
    if (profile.dateOfBirth) this.form.controls.dateOfBirth.addValidators(Validators.required);
  }

  /** Whether leaving now would lose edits. */
  isDirty(): boolean {
    return this.form.dirty;
  }

  protected languagesInvalid(): boolean {
    const control = this.form.controls.languages;
    return control.touched && control.invalid;
  }


  protected errorFor(field: TextField): string | null {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return null;
    return MESSAGES[Object.keys(control.errors)[0]] ?? MESSAGES['required'];
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.save.emit(this.changes());
  }

  /** Only what differs from the stored profile; a cleared optional field is `null`. */
  private changes(): ProfileChanges {
    const profile = this.profile();
    const value = this.form.getRawValue();
    const optional = (text: string) => text.trim() || null;
    const changes: { -readonly [K in keyof ProfileChanges]: ProfileChanges[K] } = {};

    if (value.firstName.trim() !== profile.firstName) changes.firstName = value.firstName.trim();
    if (optional(value.middleName) !== profile.middleName) changes.middleName = optional(value.middleName);
    if (value.lastName.trim() !== profile.lastName) changes.lastName = value.lastName.trim();
    const phone = value.phone.trim() ? toE164(value.phone) : null;
    if (phone !== profile.phone) changes.phone = phone;
    if (value.dateOfBirth && value.dateOfBirth !== profile.dateOfBirth) changes.dateOfBirth = value.dateOfBirth;
    if (optional(value.address) !== profile.address) changes.address = optional(value.address);
    if (!sameItems(value.languages, profile.languages)) changes.languages = value.languages;
    return changes;
  }
}

function sameItems(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item) => b.includes(item));
}

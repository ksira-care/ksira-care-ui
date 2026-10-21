import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, model, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { fullName } from '../../../core/format/person-name';
import { Language } from '../../../core/languages/language.models';
import { DialogComponent } from '../../../shared/ui/dialog.component';
import { LanguagePickerComponent } from '../../../shared/ui/language-picker.component';
import { AaptaAccount, AaptaAccountChanges } from './aaptas.models';

const atLeastOne = (control: { value: readonly string[] }) => (control.value.length ? null : { required: true });

/**
 * What an admin may change about an aapta: their login email and languages.
 * Name, phone, birthday and address are the aapta's own, in their portal.
 */
@Component({
  selector: 'app-edit-aapta-dialog',
  standalone: true,
  imports: [DialogComponent, ReactiveFormsModule, LanguagePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog [title]="'Edit ' + name()" [(open)]="open">
      <form class="edit" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="form-group">
          <label class="form-label" for="edit-email">Email (their login)</label>
          <input class="form-control" id="edit-email" type="email" formControlName="email" autocapitalize="none"
                 spellcheck="false" [class.invalid]="invalid('email')" [attr.aria-invalid]="invalid('email')"
                 aria-describedby="edit-email-hint" />
          @if (invalid('email')) {
            <p class="form-error" id="edit-email-hint">Enter a valid email address.</p>
          } @else if (emailChanged()) {
            <p class="notice" data-tone="warning" id="edit-email-hint">
              They'll be signed out everywhere and must sign in with the new email. Let them know.
            </p>
          }
        </div>

        <div class="form-group">
          <span class="form-label" id="edit-languages-label">Languages</span>
          <app-language-picker [languages]="languages()" formControlName="languages" labelledBy="edit-languages-label" />
          @if (invalid('languages')) {
            <p class="form-error">Choose at least one language.</p>
          }
        </div>

        <p class="edit__note">Their name, phone, date of birth and address are theirs to edit in the aapta portal.</p>

        @if (error()) {
          <p class="notice" data-tone="error" role="alert">{{ error() }}</p>
        }

        <div class="edit__actions">
          <button type="button" class="btn btn-ghost" [disabled]="busy()" (click)="open.set(false)">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save' }}</button>
        </div>
      </form>
    </app-dialog>
  `,
  styles: `
    .edit { display: grid; gap: 1.25rem; }
    .edit__note { font-size: 0.8125rem; color: var(--color-text-muted); }
    .edit__actions { display: flex; justify-content: flex-end; gap: var(--space-sm); }
  `,
})
export class EditAaptaDialogComponent implements OnInit {
  readonly aapta = input.required<AaptaAccount>();
  readonly languages = input.required<readonly Language[]>();
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly open = model(true);
  readonly save = output<AaptaAccountChanges>();

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    languages: this.fb.control<readonly string[]>([], atLeastOne),
  });

  private readonly email = toSignal(this.form.controls.email.valueChanges, { initialValue: '' });
  protected readonly name = computed(() => fullName(this.aapta()));
  protected readonly emailChanged = computed(
    () => this.email().trim().toLowerCase() !== this.aapta().email.toLowerCase(),
  );

  ngOnInit(): void {
    this.form.setValue({ email: this.aapta().email, languages: this.aapta().languages });
  }

  protected invalid(field: 'email' | 'languages'): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { email, languages } = this.form.getRawValue();
    const changes: { email?: string; languages?: readonly string[] } = {};
    if (this.emailChanged()) changes.email = email.trim().toLowerCase();
    const before = this.aapta().languages;
    if (languages.length !== before.length || languages.some((code) => !before.includes(code))) changes.languages = languages;
    if (Object.keys(changes).length) this.save.emit(changes);
    else this.open.set(false);
  }
}

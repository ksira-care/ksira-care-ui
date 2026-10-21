import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * A password input with a show/hide toggle, usable as a form control. Styled
 * by the global `.form-control` rules, like every other field.
 */
@Component({
  selector: 'app-password-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordFieldComponent), multi: true },
  ],
  template: `
    <div class="password-field">
      <input
        #input
        class="form-control password-field__input"
        [id]="inputId()"
        [type]="visible() ? 'text' : 'password'"
        [attr.autocomplete]="autocomplete()"
        [value]="value()"
        [disabled]="disabled()"
        [class.invalid]="invalid()"
        [attr.aria-invalid]="invalid()"
        [attr.aria-describedby]="describedBy()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <button
        type="button"
        class="password-field__toggle"
        aria-label="Show password"
        [attr.aria-controls]="inputId()"
        [attr.aria-pressed]="visible()"
        (click)="visible.set(!visible())"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          @if (visible()) {
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
  `,
  styles: `
    :host { display: block; }

    .password-field { position: relative; }

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
  `,
})
export class PasswordFieldComponent implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  /** "current-password" or "new-password", so password managers fill or suggest correctly. */
  readonly autocomplete = input.required<'current-password' | 'new-password'>();
  readonly invalid = input(false);
  readonly describedBy = input<string | null>(null);

  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly visible = signal(false);
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  focus(): void {
    this.input()?.nativeElement.focus();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
    // Typing doesn't go through the [value] binding, so a reset to the value it
    // last rendered (e.g. "" → typed → "") wouldn't reach the input without this.
    const input = this.input()?.nativeElement;
    if (input) input.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }
}

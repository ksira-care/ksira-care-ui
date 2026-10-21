import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Language } from '../../core/languages/language.models';

let nextId = 0;

/**
 * Pick one or more languages as checkboxes — every choice in view, no
 * dropdown to open. A form control whose value is ISO 639-1 codes.
 */
@Component({
  selector: 'app-language-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LanguagePickerComponent), multi: true },
  ],
  template: `
    <div class="choices" role="group" [attr.aria-labelledby]="labelledBy()" [attr.aria-describedby]="describedBy()">
      @for (language of languages(); track language.code) {
        <label class="choice" [class.choice--on]="selected().includes(language.code)">
          <input
            type="checkbox"
            [name]="name"
            [checked]="selected().includes(language.code)"
            [disabled]="disabled()"
            (change)="toggle(language.code)"
            (blur)="onTouched()"
          />
          {{ language.name }}
        </label>
      }
    </div>
  `,
  styles: `
    .choices {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
    }

    .choice {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      min-height: 40px;
      padding: 0 0.875rem;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-pill);
      color: var(--color-text);
      cursor: pointer;
      transition: border-color var(--transition), background-color var(--transition);

      input {
        width: 1rem;
        height: 1rem;
        accent-color: var(--color-green);
      }

      &:has(input:focus-visible) { outline: 2px solid var(--color-green); outline-offset: 2px; }
    }

    .choice--on {
      border-color: var(--color-open-border);
      background-color: var(--color-green-light);
    }
  `,
})
export class LanguagePickerComponent implements ControlValueAccessor {
  readonly languages = input.required<readonly Language[]>();
  /** The id of the visible label (e.g. a legend), for screen readers. */
  readonly labelledBy = input<string | null>(null);
  readonly describedBy = input<string | null>(null);

  protected readonly name = `languages-${++nextId}`;
  protected readonly selected = signal<readonly string[]>([]);
  protected readonly disabled = signal(false);

  private onChange: (codes: readonly string[]) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(codes: readonly string[] | null): void {
    this.selected.set(codes ?? []);
  }

  registerOnChange(fn: (codes: readonly string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected toggle(code: string): void {
    const current = this.selected();
    const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
    this.selected.set(next);
    this.onChange(next);
    this.onTouched();
  }
}

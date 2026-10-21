import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  model,
  viewChild,
} from '@angular/core';

let nextId = 0;

/**
 * A modal dialog on the native `<dialog>` element: focus moves inside and
 * stays there, Escape and the close button dismiss it, and focus returns to
 * whatever opened it. Bind `[(open)]`; the content goes inside.
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="dialog" [attr.aria-labelledby]="titleId" (close)="open.set(false)">
      <header class="dialog__header">
        <h2 class="dialog__title" [id]="titleId">{{ title() }}</h2>
        <button type="button" class="icon-button" aria-label="Close" (click)="open.set(false)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>
      @if (open()) {
        <div class="dialog__body"><ng-content /></div>
      }
    </dialog>
  `,
  styles: `
    .dialog {
      width: min(32rem, calc(100vw - 2rem));
      max-height: calc(100dvh - 4rem);
      margin: auto;
      padding: 0;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
      box-shadow: var(--shadow-md);
      color: var(--color-text-body);

      &::backdrop { background-color: color-mix(in srgb, var(--color-text) 30%, transparent); }
    }

    .dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-md);
      padding: var(--space-lg) var(--space-lg) 0;
    }

    .dialog__title {
      font-family: var(--font-serif);
      font-size: 1.375rem;
      font-weight: normal;
    }

    .dialog__body { padding: var(--space-md) var(--space-lg) var(--space-lg); }
  `,
})
export class DialogComponent {
  readonly title = input.required<string>();
  readonly open = model(false);

  protected readonly titleId = `dialog-title-${++nextId}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) dialog.showModal();
      if (!this.open() && dialog.open) dialog.close();
    });
  }
}

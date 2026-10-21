import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';

const CONFIRMATION_MS = 2000;

/** Copies `text` to the clipboard, and says so for a moment. */
@Component({
  selector: 'app-copy-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="icon-button copy" [attr.aria-label]="label()" (click)="copy()">
      @if (copied()) {
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      } @else {
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      }
    </button>
    <span class="visually-hidden" role="status">{{ copied() ? 'Copied' : '' }}</span>
  `,
  styles: `
    :host { display: inline-flex; vertical-align: middle; }
    .copy { width: 1.75rem; height: 1.75rem; }
  `,
})
export class CopyButtonComponent {
  readonly text = input.required<string>();
  /** What is copied, for screen readers, e.g. "Copy email". */
  readonly label = input('Copy');

  protected readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected copy(): void {
    void navigator.clipboard?.writeText(this.text()).then(() => {
      clearTimeout(this.timer);
      this.copied.set(true);
      this.timer = setTimeout(() => this.copied.set(false), CONFIRMATION_MS);
    });
  }
}

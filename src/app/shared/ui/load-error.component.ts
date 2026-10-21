import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** "We couldn't load …" with a Try again button — the same everywhere in the portal. */
@Component({
  selector: 'app-load-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="load-error" role="alert">
      <p>{{ message() }}</p>
      <button type="button" class="btn btn-outline" (click)="retry.emit()">Try again</button>
    </div>
  `,
  styles: `
    :host { display: block; }

    .load-error {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-md);
      padding: var(--space-lg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
      color: var(--color-text-body);
    }
  `,
})
export class LoadErrorComponent {
  readonly message = input.required<string>();
  readonly retry = output<void>();
}

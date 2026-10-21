import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One headline figure. Applied to a `<div>` inside a `<dl>` so the label and
 * value stay paired for screen readers.
 */
@Component({
  selector: 'div[appStatCard]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'stat-card', '[class.stat-card--compact]': 'compact()' },
  template: `
    <dt class="stat-card__label">{{ label() }}</dt>
    <dd class="stat-card__value">{{ value() }}</dd>
    <dd class="stat-card__caption">{{ caption() }}</dd>
  `,
  styles: `
    :host {
      display: block;
      padding: var(--space-lg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
    }

    .stat-card__label {
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    /* Sans-serif: Georgia only has old-style figures, which bob above and
       below the baseline; Nunito's digits sit level and line up. */
    .stat-card__value {
      margin: var(--space-sm) 0 var(--space-xs);
      font-family: var(--font-sans);
      font-size: 2.5rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
      line-height: 1.1;
      color: var(--color-text);
    }

    /* Compact: a slim strip for secondary numbers. */
    :host(.stat-card--compact) {
      padding: var(--space-md) var(--space-lg);

      .stat-card__value { font-size: 1.75rem; }

      @media (max-width: 480px) {
        padding: var(--space-md);

        .stat-card__label { font-size: 0.6875rem; letter-spacing: 0.08em; }
      }
    }

    .stat-card__caption {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly caption = input.required<string>();
  readonly compact = input(false);
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Heart mark + "Ksira Care" wordmark. Purely visual — wrap it in a link where needed. */
@Component({
  selector: 'app-brand-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.brand-logo--lg]': "size() === 'lg'" },
  template: `
    <span class="brand-logo__mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67
                 l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78
                 l1.06 1.06L12 21.23l7.78-7.78
                 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </span>
    <span class="brand-logo__name">Ksira Care</span>
  `,
  styles: `
    :host {
      --mark-size: 30px;
      --icon-size: 13px;
      --name-size: 1rem;

      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    :host(.brand-logo--lg) {
      --mark-size: 40px;
      --icon-size: 18px;
      --name-size: 1.25rem;
      gap: 0.625rem;
    }

    .brand-logo__mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--mark-size);
      height: var(--mark-size);
      background-color: var(--color-green-light);
      border-radius: 50%;
      color: var(--color-green);
      flex-shrink: 0;

      svg {
        width: var(--icon-size);
        height: var(--icon-size);
      }
    }

    .brand-logo__name {
      font-size: var(--name-size);
      font-weight: 600;
      color: var(--color-text);
      letter-spacing: -0.01em;
    }
  `,
})
export class BrandLogoComponent {
  readonly size = input<'md' | 'lg'>('md');
}

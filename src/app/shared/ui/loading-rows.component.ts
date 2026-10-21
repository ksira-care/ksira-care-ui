import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * A loading placeholder shaped like the rows that are coming, rather than one
 * big block. Announces `label` to screen readers; appears only if loading
 * takes a moment (see `.skeleton` in styles.scss).
 */
@Component({
  selector: 'app-loading-rows',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loading" aria-busy="true">
      <span class="visually-hidden">{{ label() }}</span>
      @for (row of rowList(); track row) {
        <div class="skeleton loading__row" aria-hidden="true"></div>
      }
    </div>
  `,
  styles: `
    .loading { display: grid; gap: var(--space-sm); }
    .loading__row { height: 3.5rem; border-radius: var(--radius-md); }
    .loading__row:first-child { height: 2.5rem; }
  `,
})
export class LoadingRowsComponent {
  readonly label = input('Loading…');
  readonly rows = input(4);

  protected readonly rowList = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
}

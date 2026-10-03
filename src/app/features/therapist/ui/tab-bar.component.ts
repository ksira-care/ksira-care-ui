import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  viewChildren,
} from '@angular/core';

export interface TabOption<T extends string = string> {
  readonly id: T;
  readonly label: string;
  /** Shown after the label ("Today · 3"); `null` while unknown. */
  readonly count?: number | null;
}

/**
 * Underlined tab bar following the WAI-ARIA tabs pattern with automatic
 * activation: ←/→ move and select, Home/End jump to the ends. The parent
 * renders the panel with `id` = `panelId` and `aria-labelledby` = `tabId(selected)`.
 */
@Component({
  selector: 'app-tab-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tab-bar" role="tablist" [attr.aria-label]="label()">
      @for (tab of tabs(); track tab.id; let i = $index) {
        <button
          #tabButton
          type="button"
          role="tab"
          class="tab-bar__tab"
          [id]="tabId(tab.id)"
          [attr.aria-controls]="panelId()"
          [attr.aria-selected]="selected() === tab.id"
          [tabIndex]="selected() === tab.id ? 0 : -1"
          (click)="selected.set(tab.id)"
          (keydown)="onKeydown($event, i)"
        >
          {{ tab.label }}
          @if (tab.count !== undefined && tab.count !== null) {
            <span class="tab-bar__count">· {{ tab.count }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: `
    .tab-bar {
      display: flex;
      gap: var(--space-xl);
      overflow-x: auto;
      border-bottom: 1px solid var(--color-border);
      scrollbar-width: none;
    }

    .tab-bar__tab {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      gap: 0.375rem;
      min-height: 44px;
      margin-bottom: -1px;
      padding: 0;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      color: var(--color-text-muted);
      cursor: pointer;
      transition: color var(--transition), border-color var(--transition);

      &:hover { color: var(--color-text); }

      &[aria-selected='true'] {
        border-bottom-color: var(--color-green);
        font-weight: 600;
        color: var(--color-text);
      }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: -2px;
        border-radius: var(--radius-sm);
      }
    }

    .tab-bar__count { font-weight: 600; }
  `,
})
export class TabBarComponent<T extends string = string> {
  readonly tabs = input.required<readonly TabOption<T>[]>();
  readonly selected = model.required<T>();
  /** Accessible name for the tab list. */
  readonly label = input.required<string>();
  readonly panelId = input.required<string>();

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  tabId(id: T): string {
    return `${this.panelId()}-tab-${id}`;
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const count = this.tabs().length;
    const target: Partial<Record<string, number>> = {
      ArrowRight: (index + 1) % count,
      ArrowLeft: (index - 1 + count) % count,
      Home: 0,
      End: count - 1,
    };
    const next = target[event.key];
    if (next === undefined) return;

    event.preventDefault();
    this.selected.set(this.tabs()[next].id);
    this.buttons()[next]?.nativeElement.focus();
  }
}

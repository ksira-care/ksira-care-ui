import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { initials } from '../person-name';

/**
 * Avatar button that opens the therapist's account menu (identity + sign out).
 * The name stays out of the header — the dashboard greeting already uses it —
 * and appears in full only inside the menu, where it confirms the account.
 *
 * Follows the WAI-ARIA menu button pattern: Enter/Space/↓ open it and focus
 * the first item, ↑/↓/Home/End move between items, Escape closes and returns
 * focus to the button, and Tab or a click outside closes it.
 */
@Component({
  selector: 'app-account-menu',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'onDocumentClick($event)' },
  template: `
    <button
      #trigger
      type="button"
      class="account__trigger"
      aria-haspopup="menu"
      aria-controls="account-menu"
      [attr.aria-expanded]="open()"
      [attr.aria-label]="'Account menu for ' + name()"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      <span class="account__avatar" aria-hidden="true">{{ avatarText() }}</span>
      <svg class="account__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
           aria-hidden="true">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>

    @if (open()) {
      <div
        #menu
        id="account-menu"
        class="account__menu"
        role="menu"
        aria-label="Account"
        (keydown)="onMenuKeydown($event)"
      >
        <div class="account__identity" role="none">
          <p class="account__full-name">{{ name() }}</p>
          <p class="account__email">{{ email() }}</p>
        </div>
        <div class="account__separator" role="separator"></div>
        <a
          role="menuitem"
          class="account__item"
          [routerLink]="profilePath()"
          (click)="close({ restoreFocus: false })"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>
          </svg>
          Your profile
        </a>
        <button
          type="button"
          role="menuitem"
          class="account__item"
          [disabled]="signingOut()"
          (click)="signOut.emit()"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>
          </svg>
          {{ signingOut() ? 'Signing out…' : 'Sign out' }}
        </button>
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
    }

    .account__trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      min-height: 44px;
      padding: 0.25rem 0.375rem 0.25rem 0.25rem;
      border: none;
      border-radius: var(--radius-pill);
      background: transparent;
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      color: var(--color-text);
      cursor: pointer;
      transition: background-color var(--transition);

      &:hover,
      &[aria-expanded='true'] { background-color: rgba(0, 0, 0, 0.04); }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 2px;
      }
    }

    .account__avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--color-green-light);
      color: var(--color-green);
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .account__chevron {
      color: var(--color-text-muted);
      transition: transform var(--transition);

      [aria-expanded='true'] > & { transform: rotate(180deg); }
    }

    .account__menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      z-index: 110;
      min-width: 240px;
      max-width: min(320px, calc(100vw - 2rem));
      padding-block: var(--space-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background-color: var(--color-surface);
      box-shadow: var(--shadow-md);
    }

    .account__identity { padding: var(--space-sm) var(--space-md); }

    .account__full-name {
      font-weight: 600;
      color: var(--color-text);
    }

    .account__email {
      overflow: hidden;
      font-size: 0.875rem;
      color: var(--color-text-muted);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .account__separator {
      margin-block: var(--space-sm);
      border-top: 1px solid var(--color-border);
    }

    .account__item {
      box-sizing: border-box;
      display: flex;
      text-decoration: none;
      align-items: center;
      gap: var(--space-sm);
      width: 100%;
      padding: 0.625rem var(--space-md);
      border: none;
      background: transparent;
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      color: var(--color-text-body);
      text-align: left;
      cursor: pointer;

      &:hover:not(:disabled),
      &:focus-visible {
        outline: none;
        background-color: var(--color-surface-muted);
        color: var(--color-text);
      }

      &:disabled { opacity: 0.6; cursor: progress; }
    }
  `,
})
export class AccountMenuComponent {
  readonly name = input.required<string>();
  readonly email = input.required<string>();
  readonly signingOut = input(false);
  readonly profilePath = input.required<string>();
  readonly signOut = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  protected readonly open = signal(false);
  protected readonly avatarText = computed(() => initials(this.name()));

  protected toggle(): void {
    if (this.open()) this.close({ restoreFocus: false });
    else this.openMenu('first');
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.openMenu(event.key === 'ArrowDown' ? 'first' : 'last');
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    const items = this.items();
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close({ restoreFocus: true });
        break;
      case 'Tab':
        this.close({ restoreFocus: false });
        break;
      case 'ArrowDown':
        event.preventDefault();
        focusAt(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(items.length - 1);
        break;
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close({ restoreFocus: false });
    }
  }

  private openMenu(focus: 'first' | 'last'): void {
    this.open.set(true);
    afterNextRender(
      () => {
        const items = this.items();
        items[focus === 'first' ? 0 : items.length - 1]?.focus();
      },
      { injector: this.injector },
    );
  }

  protected close({ restoreFocus }: { restoreFocus: boolean }): void {
    this.open.set(false);
    if (restoreFocus) this.trigger().nativeElement.focus();
  }

  private items(): HTMLElement[] {
    const menu = this.menu()?.nativeElement;
    return menu ? [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')] : [];
  }
}

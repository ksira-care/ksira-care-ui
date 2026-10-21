import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';

/** Quick navigations show nothing; only waits longer than this do. */
const SHOW_AFTER_MS = 800;
/** After this, say why it's slow. */
const EXPLAIN_AFTER_MS = 5000;

/**
 * Says the page is on its way while a navigation waits on the server — e.g.
 * the sign-in check after the free-tier backend has gone to sleep, which can
 * take up to a minute. Without it the screen would just stay blank.
 */
@Component({
  selector: 'app-navigation-wait',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (stage() !== 'idle') {
      <div class="wait" role="status" aria-live="polite">
        <span class="spinner wait__spinner" aria-hidden="true"></span>
        @if (stage() === 'slow') {
          <p class="wait__title">Waking up Ksira Care…</p>
          <p class="wait__text">After a quiet spell this can take up to a minute. Thanks for waiting.</p>
        } @else {
          <span class="visually-hidden">Loading…</span>
        }
      </div>
    }
  `,
  styles: `
    .wait {
      position: fixed;
      inset: 0;
      z-index: 200;
      display: grid;
      place-content: center;
      justify-items: center;
      gap: var(--space-sm);
      padding: var(--space-lg);
      background-color: var(--color-glass-strong);
      text-align: center;
    }

    .wait__spinner {
      width: 28px;
      height: 28px;
      color: var(--color-green);
    }

    .wait__title {
      margin-top: var(--space-sm);
      font-family: var(--font-serif);
      font-size: 1.375rem;
      color: var(--color-text);
    }

    .wait__text {
      max-width: 32ch;
      color: var(--color-text-muted);
    }
  `,
})
export class NavigationWaitComponent {
  protected readonly stage = signal<'idle' | 'waiting' | 'slow'>('idle');
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.reset());
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.reset();
          this.timers = [
            setTimeout(() => this.stage.set('waiting'), SHOW_AFTER_MS),
            setTimeout(() => this.stage.set('slow'), EXPLAIN_AFTER_MS),
          ];
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.reset();
        }
      });
  }

  private reset(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.stage.set('idle');
  }
}

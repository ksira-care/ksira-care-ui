import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';

/**
 * WelcomePopupComponent
 *
 * "Coming soon" overlay shown on every page load/refresh.
 * Uses a module-level boolean flag — resets whenever the JS
 * module is re-evaluated (i.e. every full page load/refresh).
 * Navigation within the SPA does NOT re-trigger it because
 * the module stays loaded.
 *
 * SEO notes:
 *  - Content inside the popup is wrapped in aria-modal="true"
 *    and role="dialog" so screen readers treat it correctly.
 *  - The backdrop uses aria-hidden on the page behind via
 *    the parent toggling inert on <main>.
 *  - The modal content is meaningful text (not hidden from
 *    crawlers via display:none at load time — it's rendered
 *    server-visibly but visually overlaid).
 */

// Module-level flag: true until dismissed in this page load.
// Automatically resets to true on every full refresh.
let _shownThisLoad = false;

@Component({
  selector: 'app-welcome-popup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div
      class="backdrop"
      (click)="dismiss()"
      aria-hidden="true"
    ></div>

    <!-- Dialog -->
    <div
      class="popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-heading"
      aria-describedby="popup-desc"
    >
      <!-- Decorative mint orbs (aria-hidden) -->
      <span class="orb orb--tr" aria-hidden="true"></span>
      <span class="orb orb--bl" aria-hidden="true"></span>

      <!-- Close button -->
      <button
        class="popup__close"
        (click)="dismiss()"
        aria-label="Close welcome message"
        autofocus
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <line x1="18" y1="6"  x2="6"  y2="18"/>
          <line x1="6"  y1="6"  x2="18" y2="18"/>
        </svg>
      </button>

      <!-- Brand mark -->
      <div class="popup__brand" aria-hidden="true">
        <span class="popup__brand-circle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67
                     l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78
                     l1.06 1.06L12 21.23l7.78-7.78
                     1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </span>
        <span class="popup__brand-name">Ksira Care</span>
      </div>

      <!-- Coming soon pill -->
      <div class="popup__pill" aria-hidden="true">
        <span class="popup__pill-dot">•</span>
        Coming soon
      </div>

      <!-- Heading -->
      <h1 id="popup-heading" class="popup__heading">
        A quiet place to be heard is on its way.
      </h1>

      <!-- Sub-copy -->
      <p id="popup-desc" class="popup__desc">
        We're putting the finishing touches on Ksira Care.
        Calm, one-to-one conversations with a listening companion —
        on good days, hard days, and everything in between.
      </p>

      <!-- Info card -->
      <div class="popup__card" aria-label="A message from Ksira Care">
        <span class="popup__card-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1
                     2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <div>
          <p class="popup__card-title">We can't wait to listen.</p>
          <p class="popup__card-sub">Thank you for your patience.</p>
        </div>
      </div>

      <!-- Footer meta -->
      <p class="popup__meta" aria-hidden="true">
        60-minute sessions&nbsp;&nbsp;·&nbsp;&nbsp;Worldwide&nbsp;&nbsp;·&nbsp;&nbsp;Private, never recorded
      </p>
    </div>
  `,
  styles: `
    /* ── Backdrop ──────────────────────────────── */
    .backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 200;
      cursor: pointer;
    }

    /* ── Dialog card ───────────────────────────── */
    .popup {
      position: fixed;
      inset: 0;
      z-index: 201;
      margin: auto;
      width: min(680px, calc(100vw - 2rem));
      max-height: calc(100dvh - 2rem);
      overflow-y: auto;
      background-color: #ffffff;
      border-radius: 20px;
      border: 1px solid #e8e8e8;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.1);
      padding: 3rem 3.5rem 2.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      /* Centre vertically/horizontally */
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      /* Entrance animation */
      animation: popup-in 300ms cubic-bezier(0.34, 1.4, 0.64, 1) both;
      overflow: hidden;    /* clip orbs */

      @media (max-width: 480px) {
        padding: 2.5rem 1.75rem 2rem;
        border-radius: 16px;
      }
    }

    @keyframes popup-in {
      from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)); }
      to   { opacity: 1; transform: translate(-50%, -50%); }
    }

    /* ── Decorative mint orbs ──────────────────── */
    .orb {
      position: absolute;
      border-radius: 50%;
      background-color: oklch(95% 0.07 152);
      pointer-events: none;
    }

    .orb--tr {
      width: 220px; height: 220px;
      top: -60px; right: -60px;
    }

    .orb--bl {
      width: 180px; height: 180px;
      bottom: -50px; left: -50px;
    }

    /* ── Close button ──────────────────────────── */
    .popup__close {
      position: absolute;
      top: 1rem; right: 1rem;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      background-color: transparent;
      border: 1px solid #e8e8e8;
      border-radius: 50%;
      cursor: pointer;
      color: #6b7280;
      transition: background-color 150ms ease, color 150ms ease;
      z-index: 1;

      &:hover {
        background-color: #f5f5f5;
        color: #1a3328;
      }

      &:focus-visible {
        outline: 2px solid #1f4d35;
        outline-offset: 2px;
      }
    }

    /* ── Brand row ─────────────────────────────── */
    .popup__brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.75rem;
      position: relative;
      z-index: 1;
    }

    .popup__brand-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px; height: 34px;
      background-color: oklch(95% 0.07 152);
      border-radius: 50%;
      color: #1f4d35;
    }

    .popup__brand-name {
      font-size: 1rem;
      font-weight: 600;
      color: #1a3328;
      letter-spacing: -0.01em;
    }

    /* ── Coming soon pill ──────────────────────── */
    .popup__pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border: 1px solid #e8e8e8;
      border-radius: 999px;
      padding: 0.3rem 0.875rem;
      font-size: 0.8125rem;
      color: #6b7280;
      margin-bottom: 1.75rem;
      position: relative;
      z-index: 1;
    }

    .popup__pill-dot {
      font-size: 0.5rem;
      color: #9ca3af;
    }

    /* ── Heading ───────────────────────────────── */
    .popup__heading {
      font-family: system-ui, -apple-system, 'Nunito', sans-serif;
      font-size: clamp(2rem, 5vw, 2.75rem);
      font-weight: 800;
      color: #1a3328;
      line-height: 1.12;
      letter-spacing: -0.03em;
      margin-bottom: 1.25rem;
      max-width: 14ch;
      position: relative;
      z-index: 1;
    }

    /* ── Body copy ─────────────────────────────── */
    .popup__desc {
      font-size: 1rem;
      color: #6b7280;
      line-height: 1.7;
      max-width: 42ch;
      margin-bottom: 2rem;
      position: relative;
      z-index: 1;
    }

    /* ── Info card ─────────────────────────────── */
    .popup__card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      background-color: oklch(97% 0.04 152);
      border-radius: 12px;
      padding: 0.875rem 1.25rem;
      width: 100%;
      max-width: 340px;
      text-align: left;
      margin-bottom: 1.75rem;
      position: relative;
      z-index: 1;
    }

    .popup__card-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px; height: 32px;
      background-color: oklch(90% 0.09 152);
      border-radius: 50%;
      color: #1f4d35;
      flex-shrink: 0;
    }

    .popup__card-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1a3328;
      margin-bottom: 2px;
    }

    .popup__card-sub {
      font-size: 0.8125rem;
      color: #9ca3af;
    }

    /* ── Footer meta ───────────────────────────── */
    .popup__meta {
      font-size: 0.8125rem;
      color: #9ca3af;
      position: relative;
      z-index: 1;
    }
  `,
})
export class WelcomePopupComponent implements OnInit {
  @Output() readonly closed = new EventEmitter<void>();

  ngOnInit(): void {
    // Trap scroll on body while popup is open
    document.body.style.overflow = 'hidden';
  }

  dismiss(): void {
    // Mark dismissed for this page load only — resets on refresh
    _shownThisLoad = true;
    // Restore body scroll
    document.body.style.overflow = '';
    this.closed.emit();
  }

  /** Show if not yet dismissed in this page load */
  static shouldShow(): boolean {
    return !_shownThisLoad;
  }
}

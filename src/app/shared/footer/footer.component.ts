import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="container footer__top">

        <!-- Brand column -->
        <div class="footer__brand">
          <a routerLink="/" class="footer__logo" aria-label="Ksira Care – Home">
            <span class="footer__logo-circle" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67
                         l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06
                         L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </span>
            Ksira Care
          </a>
          <p class="footer__tagline">
            A quiet place to be heard. One-to-one supportive listening with
            care and confidentiality.
          </p>
        </div>

        <!-- Pages -->
        <div class="footer__col">
          <h3 class="footer__col-heading">Pages</h3>
          <ul role="list" class="footer__col-links">
            <li><a routerLink="/">Home</a></li>
            <li><a routerLink="/about">About Us</a></li>
            <li><a routerLink="/services">Our Services</a></li>
            <li><a routerLink="/book">Book a Session</a></li>
          </ul>
        </div>

        <!-- Legal -->
        <div class="footer__col">
          <h3 class="footer__col-heading">Legal</h3>
          <ul role="list" class="footer__col-links">
            <li><a routerLink="/privacy">Privacy Policy</a></li>
            <li><a routerLink="/terms">Terms of Service</a></li>
          </ul>
        </div>

      </div>

      <!-- Bottom strip -->
      <div class="footer__bottom">
        <div class="container footer__bottom-inner">
          <p class="footer__disclaimer">
            Ksira Care is a non-clinical peer support and active-listening
            service. It is not a substitute for therapy, counselling, or
            medical care.
          </p>
          <p class="footer__copy">
            &copy; {{ year }} Ksira Care.&thinsp; All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: `
    /* Mint green background — matches Lovable footer */
    .footer {
      background-color: var(--color-bg-alt);
      margin-top: auto;
    }

    .footer__top {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 2.5rem;
      padding-top: 2.5rem;
      padding-bottom: 2.5rem;

      @media (max-width: 768px) { grid-template-columns: 1fr 1fr; }
      @media (max-width: 480px) { grid-template-columns: 1fr; gap: 2rem; }
    }

    /* ── Brand ── */
    .footer__logo {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 0.875rem;

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 2px;
        border-radius: var(--radius-sm);
      }
    }

    .footer__logo-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      background-color: var(--color-green-light);
      border-radius: 50%;
      color: var(--color-green);
      flex-shrink: 0;
    }

    .footer__tagline {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      line-height: 1.6;
      max-width: 30ch;
    }

    /* ── Columns ── */
    .footer__col-heading {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: 0.875rem;
    }

    .footer__col-links {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;

      a {
        font-size: 0.9375rem;
        font-weight: 400;
        color: var(--color-text-muted);
        transition: color var(--transition);

        &:hover { color: var(--color-text); }

        &:focus-visible {
          outline: 2px solid var(--color-green);
          outline-offset: 2px;
          border-radius: 2px;
        }
      }
    }

    /* ── Bottom strip ── */
    .footer__bottom {
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .footer__bottom-inner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding-top: 1rem;
      padding-bottom: 1.375rem;

      @media (max-width: 600px) { flex-direction: column; }
    }

    .footer__disclaimer {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      max-width: 62ch;
      line-height: 1.55;
    }

    .footer__copy {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      flex-shrink: 0;
      white-space: nowrap;
    }
  `,
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
}

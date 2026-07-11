import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  HostListener,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  exact: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="navbar">
      <div class="container navbar__inner">

        <!-- Brand -->
        <a routerLink="/" class="navbar__brand" aria-label="Ksira Care – Home">
          <span class="navbar__logo-circle" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67
                       l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78
                       l1.06 1.06L12 21.23l7.78-7.78
                       1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </span>
          <span class="navbar__name">Ksira Care</span>
        </a>

        <!-- Desktop nav -->
        <nav class="navbar__nav" aria-label="Main navigation">
          <ul role="list" class="navbar__links">
            @for (item of navItems; track item.path) {
              <li>
                <a
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: item.exact }"
                  class="navbar__link"
                >{{ item.label }}</a>
              </li>
            }
          </ul>
        </nav>

        <a routerLink="/book" class="btn btn-primary navbar__cta">
          Book Now
        </a>

        <!-- Burger -->
        <button
          class="navbar__burger"
          [class.open]="menuOpen()"
          (click)="toggleMenu()"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="mobile-nav"
          aria-label="Toggle menu"
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      <!-- Mobile drawer -->
      <div
        id="mobile-nav"
        class="navbar__mobile"
        [class.open]="menuOpen()"
        role="dialog"
        aria-label="Mobile navigation"
      >
        <ul role="list">
          @for (item of navItems; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                class="navbar__mobile-link"
                (click)="closeMenu()"
              >{{ item.label }}</a>
            </li>
          }
          <li>
            <a routerLink="/book" class="btn btn-primary"
               style="width:100%;margin-top:0.75rem"
               (click)="closeMenu()">Book Now</a>
          </li>
        </ul>
      </div>
    </header>
  `,
  styles: `
    /* ─── Shell ────────────────────────────────────
       The host element (<app-navbar>) must be the
       sticky, opaque layer — not just the inner
       <header>. Otherwise page content scrolls
       behind the transparent host element.
    ──────────────────────────────────────────────── */
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 100;
      /* Solid fallback + frosted-glass overlay matches Lovable scroll behaviour */
      background-color: rgba(255, 255, 255, 0.85);
      -webkit-backdrop-filter: blur(14px) saturate(1.4);
      backdrop-filter: blur(14px) saturate(1.4);
      border-bottom: 1px solid var(--color-border-nav);
      transition: box-shadow 200ms ease, background-color 200ms ease;
    }

    :host(.navbar--raised) {
      background-color: rgba(255, 255, 255, 0.95);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .navbar {
      /* background handled entirely by :host */
    }

    .navbar--raised {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    /* ─── Inner row ─────────────────────────────── */
    .navbar__inner {
      height: var(--nav-height);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    /* ─── Brand ─────────────────────────────────── */
    .navbar__brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
      text-decoration: none;

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 3px;
        border-radius: var(--radius-sm);
      }
    }

    .navbar__logo-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      background-color: var(--color-green-light);
      border-radius: 50%;
      color: var(--color-green);
      flex-shrink: 0;
    }

    .navbar__name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text);
      letter-spacing: -0.01em;
    }

    /* ─── Desktop links ──────────────────────────── */
    .navbar__nav { margin-left: auto; }

    .navbar__links {
      display: flex;
      align-items: center;
      gap: 0;
    }

    .navbar__link {
      display: block;
      padding: 0.4rem 0.875rem;
      font-size: 0.9375rem;   /* 15px — same as Lovable */
      font-weight: 400;
      color: var(--color-text-muted);
      border-radius: var(--radius-pill);
      transition: color 150ms ease, background-color 150ms ease;
      white-space: nowrap;

      &:hover {
        color: var(--color-text);
        background-color: rgba(0, 0, 0, 0.04);
      }

      /* Active: just darker text, no background fill */
      &.active {
        color: var(--color-text);
        font-weight: 500;
      }

      &:focus-visible {
        outline: 2px solid var(--color-green);
        outline-offset: 2px;
      }
    }

    /* ─── CTA pill ───────────────────────────────── */
    .navbar__cta {
      flex-shrink: 0;
      padding: 0.5rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    /* ─── Burger ─────────────────────────────────── */
    .navbar__burger {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 36px; height: 36px;
      padding: 6px;
      background: none;
      border: none;
      cursor: pointer;
      border-radius: var(--radius-sm);
      margin-left: auto;

      span {
        display: block;
        height: 1.5px;
        background-color: var(--color-text);
        border-radius: 2px;
        transform-origin: center;
        transition: transform 200ms ease, opacity 200ms ease;
      }

      &.open {
        span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        span:nth-child(2) { opacity: 0; }
        span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }
      }

      &:focus-visible { outline: 2px solid var(--color-green); outline-offset: 2px; }
    }

    /* ─── Mobile drawer ──────────────────────────── */
    .navbar__mobile {
      display: none;
      background-color: #ffffff;
      border-top: 1px solid var(--color-border-nav);
      padding: 0.75rem 1.5rem 1.5rem;

      &.open { display: block; }

      ul { display: flex; flex-direction: column; gap: 0.25rem; }
    }

    .navbar__mobile-link {
      display: block;
      padding: 0.625rem 0.875rem;
      font-size: 1rem;
      color: var(--color-text-muted);
      border-radius: var(--radius-md);
      transition: background-color 150ms ease, color 150ms ease;

      &:hover { background-color: rgba(0, 0, 0, 0.04); color: var(--color-text); }
      &.active { color: var(--color-green); font-weight: 500; }
    }

    @media (max-width: 768px) {
      .navbar__nav, .navbar__cta { display: none; }
      .navbar__burger { display: flex; }
    }
  `,
})
export class NavbarComponent {
  protected readonly navItems: NavItem[] = [
    { label: 'Home',         path: '/',         exact: true  },
    { label: 'About Us',     path: '/about',    exact: false },
    { label: 'Our Services', path: '/services', exact: false },
  ];

  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);

  @HostBinding('class.navbar--raised')
  get isRaised(): boolean { return this.scrolled(); }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 10);
  }

  protected toggleMenu(): void { this.menuOpen.update((v) => !v); }
  protected closeMenu(): void  { this.menuOpen.set(false); }
}

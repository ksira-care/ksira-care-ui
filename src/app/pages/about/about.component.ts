import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Principle {
  icon: string;
  title: string;
  body: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page header -->
    <section class="page-header section" aria-labelledby="about-heading">
      <div class="container">
        <span class="section-label">About Us</span>
        <h1 id="about-heading" class="section-title about__title">
          A space built on&nbsp;listening.
        </h1>
        <p class="section-body">
          Ksira Care started from a simple belief: most of us don't need advice
          — we just need someone to listen, without rushing or fixing.
        </p>
      </div>
    </section>

    <hr class="divider" />

    <!-- Why we exist -->
    <section class="section" aria-labelledby="why-heading">
      <div class="container about-grid">
        <div>
          <h2 id="why-heading" class="about__h2">Why we exist</h2>
          <p class="about__body">
            Life can feel heavy — a hard week at work, a quiet move to a new
            country, a loss that nobody around you quite understands. Ksira Care
            exists for those moments.
          </p>
          <p class="about__body">
            A paid, private space where the entire hour is yours to talk and
            feel heard, on your own terms.
          </p>
        </div>
        <div class="about__callout" aria-hidden="true">
          <span class="about__callout-icon">🌱</span>
          <p>No agenda. No clock-watching. No fixing.</p>
        </div>
      </div>
    </section>

    <hr class="divider" />

    <!-- Our approach -->
    <section
      class="section section--muted"
      aria-labelledby="approach-heading"
    >
      <div class="container">
        <h2 id="approach-heading" class="about__h2">Our approach</h2>
        <ul class="principles" role="list" aria-label="Our approach principles">
          @for (p of principles; track p.title) {
            <li class="principle">
              <span class="principle__icon" aria-hidden="true">{{ p.icon }}</span>
              <div>
                <h3 class="principle__title">{{ p.title }}</h3>
                <p class="principle__body">{{ p.body }}</p>
              </div>
            </li>
          }
        </ul>
      </div>
    </section>

    <hr class="divider" />

    <!-- Meet your listener -->
    <section class="section" aria-labelledby="listener-heading">
      <div class="container listener">
        <div class="listener__avatar" aria-hidden="true">
          <span>✦</span>
        </div>
        <div class="listener__content">
          <h2 id="listener-heading" class="about__h2">Meet your listener</h2>
          <p class="about__body">
            Hello — I'm the active-listening companion behind Ksira Care. I'm
            not a therapist or a clinician, and I won't pretend to be. What I
            am is a steady, kind presence trained in attentive listening.
          </p>
          <p class="about__body">
            My role is simply to make space for you: to slow down, to listen
            carefully, and to honour whatever you share.
          </p>
          <p class="about__body">
            If this is your first time reaching out for support of any kind —
            that's okay. You're welcome here, exactly as you are.
          </p>
          <a routerLink="/book" class="btn btn-primary" style="margin-top:1.5rem">
            Book a Session
          </a>
        </div>
      </div>
    </section>
  `,
  styles: `
    /* ── Page header — mint background, centered ── */
    .page-header {
      background-color: var(--color-bg-alt);
      text-align: center;
    }

    .page-header .section-label {
      color: var(--color-text-muted);
    }

    .about__title {
      font-family: var(--font-sans);
      font-size: clamp(2.5rem, 6vw, 3.75rem);
      font-weight: 600;
      color: var(--color-green);
      max-width: none;
      margin-bottom: 1rem;
    }

    .page-header .section-body {
      max-width: 60ch;
      margin-inline: auto;
      color: var(--color-text-body);
    }

    .about__h2 {
      font-family: var(--font-sans);
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 600;
      color: var(--color-green);
      margin-bottom: var(--space-lg);
    }

    .about__body {
      font-size: 1.0625rem;
      color: var(--color-text-muted);
      max-width: 60ch;
      margin-bottom: var(--space-md);
    }

    .about-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      gap: var(--space-3xl);

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
        gap: var(--space-xl);
      }
    }

    .about__callout {
      background-color: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-2xl);
      text-align: center;

      p {
        font-family: var(--font-serif);
        font-size: 1.25rem;
        color: var(--color-accent);
        font-style: italic;
      }
    }

    .about__callout-icon {
      display: block;
      font-size: 2rem;
      margin-bottom: var(--space-md);
    }

    /* Principles */
    .section--muted {
      background-color: var(--color-surface-muted);
    }

    .principles {
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
      margin-top: var(--space-lg);
    }

    .principle {
      display: flex;
      align-items: flex-start;
      gap: var(--space-lg);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
    }

    .principle__icon {
      font-size: 1.5rem;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .principle__title {
      font-family: var(--font-serif);
      font-size: 1.125rem;
      color: var(--color-text);
      margin-bottom: var(--space-xs);
    }

    .principle__body {
      font-size: 0.9375rem;
      color: var(--color-text-muted);
    }

    /* Listener */
    .listener {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2xl);

      @media (max-width: 640px) {
        flex-direction: column;
        gap: var(--space-xl);
      }
    }

    .listener__avatar {
      flex-shrink: 0;
      width: 80px;
      height: 80px;
      background-color: rgba(44, 95, 74, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      span {
        font-size: 1.75rem;
        color: var(--color-cta);
      }
    }
  `,
})
export class AboutComponent {
  protected readonly principles: Principle[] = [
    {
      icon: '🤲',
      title: 'Judgment-free',
      body: "Whatever you bring, you'll be met with warmth.",
    },
    {
      icon: '🔒',
      title: 'Confidential',
      body: 'What you share in session stays in session.',
    },
    {
      icon: '🌿',
      title: 'Present',
      body: 'No phones, no distractions — just you and a calm, attentive ear.',
    },
  ];
}

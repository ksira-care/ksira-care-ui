import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Step  { number: string; title: string; body: string; }
interface Topic { label: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ══════════════════════════════════════════
         HERO — fills the full viewport height
    ══════════════════════════════════════════ -->
    <section class="hero" aria-labelledby="hero-heading">
      <div class="container hero__inner">

        <!-- Left: copy -->
        <div class="hero__copy">

          <!-- Bordered pill eyebrow — matches Lovable exactly -->
          <div class="hero__eyebrow" aria-hidden="true">
            <span class="hero__eyebrow-dot"></span>
            Someone to talk to, any day
          </div>

          <h1 id="hero-heading" class="hero__title">
            Someone to truly listen — whenever you feel like talking.
          </h1>

          <p class="hero__body">
            Ksira Care offers calm, one-to-one conversations with a listening
            companion. A rough day, a happy one, or something in between —
            talk openly and be heard. No judgement. Just respect, and someone
            who's fully there.
          </p>

          <div class="hero__actions">
            <a routerLink="/book" class="btn btn-primary hero__btn-book">
              Book a Session
            </a>
            <a routerLink="/services" class="hero__learn-link">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>

          <p class="hero__footnote">
            60-minute sessions
            <span class="hero__dot" aria-hidden="true"></span>
            Worldwide
            <span class="hero__dot" aria-hidden="true"></span>
            Private, never recorded
          </p>
        </div>

        <!-- Right: mint visual card -->
        <div class="hero__visual" aria-hidden="true">
          <div class="hero__mint-block">
            <!-- White sub-card floats at the bottom of the mint block -->
            <div class="hero__sub-card">
              <span class="hero__chat-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1
                           2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </span>
              <div class="hero__sub-text">
                <p class="hero__sub-title">A conversation that's all yours</p>
                <p class="hero__sub-meta">60 minutes, just for you</p>
                <p class="hero__quote">"Take your time. I'm here."</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ══════════════════════════════════════════
         HOW IT WORKS — white bg, centered
    ══════════════════════════════════════════ -->
    <section class="section how" aria-labelledby="how-heading">
      <div class="container">
        <div class="how__header">
          <h2 id="how-heading" class="how__title">How it works</h2>
          <p class="how__sub">Simple, gentle, and on your terms.</p>
        </div>

        <ol class="steps" role="list">
          @for (step of steps; track step.number) {
            <li class="step">
              <p class="step__num">{{ step.number }}</p>
              <h3 class="step__title">{{ step.title }}</h3>
              <p class="step__body">{{ step.body }}</p>
            </li>
          }
        </ol>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         TOPICS — light mint band
    ══════════════════════════════════════════ -->
    <section class="topics-band" aria-labelledby="topics-heading">
      <div class="container topics-inner">
        <div class="topics-copy">
          <h2 id="topics-heading" class="topics-title">
            Whatever's on your mind.
          </h2>
          <p class="topics-body">
            Some days you need to vent. Some days you have good news and no
            one to tell. Some days you just want someone to talk to. You don't
            need a reason to want to be heard.
          </p>
        </div>

        <ul class="topics-grid" role="list" aria-label="Topics you can bring">
          @for (t of topics; track t.label) {
            <li class="topic-item">{{ t.label }}</li>
          }
        </ul>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         PRICING — white bg, centered
    ══════════════════════════════════════════ -->
    <section class="section pricing" aria-labelledby="pricing-heading">
      <div class="container pricing-inner">
        <h2 id="pricing-heading" class="pricing-title">Simple pricing.</h2>
        <p class="pricing-sub">One session, one price. No subscriptions.</p>

        <div class="pricing-card">
          <p class="pricing-price" aria-label="899 rupees">
            <span class="pricing-dollar" aria-hidden="true">₹</span>899
          </p>
          <p class="pricing-unit">per 60-minute session</p>
          <a routerLink="/book" class="btn btn-primary pricing-cta">Book Now</a>
          <p class="pricing-note">
            We'll only ever email you your booking confirmation and session link.
            Nothing else.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    /* ── HERO ──────────────────────────────────────
       Fills the viewport so "How it works" is NOT
       visible on load — exactly like Lovable.
    ─────────────────────────────────────────────── */
    .hero {
      /* viewport height minus the sticky navbar */
      min-height: calc(100dvh - var(--nav-height));
      display: flex;
      align-items: center;
      background-color: var(--color-bg);
      padding-block: 3rem;
    }

    .hero__inner {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      gap: 4rem;
      width: 100%;

      @media (max-width: 800px) {
        grid-template-columns: 1fr;
        gap: 2.5rem;
      }
    }

    /* Eyebrow — bordered pill, matches Lovable */
    .hero__eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-pill);
      padding: 0.3rem 0.875rem;
      margin-bottom: 1.5rem;
      background-color: transparent;
    }

    .hero__eyebrow-dot {
      display: inline-block;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background-color: currentColor;
      flex-shrink: 0;
    }

    /* Large bold heading */
    .hero__title {
      font-family: var(--font-sans);
      font-size: clamp(2.25rem, 5vw, 3.25rem);
      font-weight: 600;
      color: var(--color-green);
      line-height: 1.2;
      letter-spacing: -0.01em;
      margin-bottom: 1.25rem;
    }

    .hero__body {
      font-size: 1rem;
      color: var(--color-text-muted);
      max-width: 42ch;
      line-height: 1.7;
      margin-bottom: 2rem;
    }

    .hero__actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }

    .hero__btn-book {
      padding: 0.75rem 1.625rem;
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .hero__learn-link {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--color-text-muted);
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-pill);
      transition: background-color var(--transition), color var(--transition);

      &:hover {
        background-color: var(--color-green-light);
        color: var(--color-green);
      }
    }

    .hero__footnote {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-size: 0.8125rem;
      color: var(--color-text-subtle);
    }

    .hero__dot {
      display: inline-block;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: currentColor;
      flex-shrink: 0;
    }

    /* ── Mint visual (right column) ──────────────── */
    .hero__visual {
      @media (max-width: 800px) { order: -1; }
    }

    /* oklch(95% .07 152) — exact Lovable mint colour */
    .hero__mint-block {
      background-color: oklch(95% 0.07 152);
      border-radius: var(--radius-xl);
      padding: 2rem;
      min-height: 440px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    /* White sub-card */
    .hero__sub-card {
      background-color: #ffffff;
      border-radius: var(--radius-lg);
      padding: 1.125rem 1.25rem 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      box-shadow: var(--shadow-sm);
    }

    .hero__sub-text {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .hero__chat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px; height: 30px;
      background-color: oklch(90% 0.09 152);
      border-radius: 50%;
      color: var(--color-green);
      flex-shrink: 0;
      margin-top: 1px;
    }

    .hero__sub-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 2px;
    }

    .hero__sub-meta {
      font-size: 0.8125rem;
      color: var(--color-text-subtle);
      margin-bottom: 0.625rem;
    }

    .hero__quote {
      font-size: 0.875rem;
      font-style: italic;
      color: var(--color-text-muted);
    }

    /* ── HOW IT WORKS ──────────────────────────────
       White bg, heading & sub centered
    ─────────────────────────────────────────────── */
    .how { background-color: var(--color-bg); }

    .how__header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .how__title {
      font-family: var(--font-sans);
      font-size: clamp(1.75rem, 3.5vw, 2.25rem);
      font-weight: 600;
      color: var(--color-green);
      margin-bottom: 0.5rem;
    }

    .how__sub {
      font-size: 1.0625rem;
      color: var(--color-text-muted);
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;

      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }

    .step {
      background-color: var(--color-surface);
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: var(--radius-xl);
      padding: 1.75rem 1.5rem 2rem;
      box-shadow: 0 4px 32px rgba(0, 0, 0, 0.06);
    }

    /* Small muted number "01" "02" "03" — no badge styling */
    .step__num {
      font-size: 0.8125rem;
      color: var(--color-text-subtle);
      margin-bottom: 0.875rem;
      font-family: var(--font-sans);
    }

    .step__title {
      font-family: var(--font-sans);
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--color-green);
      margin-bottom: 0.5rem;
    }

    .step__body {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      line-height: 1.6;
    }

    /* ── TOPICS ────────────────────────────────────
       Light mint full-width band
    ─────────────────────────────────────────────── */
    .topics-band {
      background-color: oklch(97% 0.04 152);
      padding-block: 5rem;
    }

    .topics-inner {
      max-width: var(--max-width);
      margin-inline: auto;
      padding-inline: 2rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      gap: 4rem;

      @media (max-width: 760px) {
        grid-template-columns: 1fr;
        gap: 2.5rem;
        padding-inline: 1.25rem;
      }
    }

    .topics-title {
      font-family: var(--font-sans);
      font-size: clamp(1.75rem, 3.5vw, 2.25rem);
      font-weight: 600;
      color: var(--color-green);
      margin-bottom: 0.75rem;
    }

    .topics-body {
      font-size: 1rem;
      color: var(--color-text-body);
      line-height: 1.65;
      max-width: 40ch;
    }

    /* 2-column grid of white rounded-rect items */
    /* Pills flow like words in a sentence, wrapping as needed. */
    .topics-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.625rem;
    }

    .topic-item {
      background-color: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.07);
      border-radius: var(--radius-pill);
      padding: 0.5rem 1.25rem;
      font-size: 0.875rem;
      color: var(--color-text-body);
    }

    /* ── PRICING ───────────────────────────────────
       White bg, everything centered
    ─────────────────────────────────────────────── */
    .pricing { background-color: var(--color-bg); }

    .pricing-inner {
      max-width: var(--max-width);
      margin-inline: auto;
      padding-inline: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      @media (max-width: 640px) { padding-inline: 1.25rem; }
    }

    .pricing-title {
      font-family: var(--font-sans);
      font-size: clamp(1.75rem, 3.5vw, 2.25rem);
      font-weight: 600;
      color: var(--color-green);
      margin-bottom: 0.5rem;
    }

    .pricing-sub {
      font-size: 1rem;
      color: var(--color-text-muted);
      margin-bottom: 2.5rem;
    }

    .pricing-card {
      background-color: #ffffff;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 2.5rem 2rem 2rem;
      box-shadow: var(--shadow-md);
      max-width: 640px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .pricing-price {
      font-family: var(--font-sans);
      font-size: 4rem;
      font-weight: 600;
      color: var(--color-green);
      line-height: 1;
      letter-spacing: -0.02em;
      margin-bottom: 0.375rem;
    }

    .pricing-dollar {
      font-size: 1.75rem;
      font-weight: 700;
      vertical-align: top;
      letter-spacing: 0;
      margin-right: 2px;
      line-height: 1.3;
    }

    .pricing-unit {
      font-size: 0.9375rem;
      color: var(--color-text-muted);
      margin-bottom: 1.5rem;
    }

    .pricing-cta {
      width: 100%;
      max-width: 220px;
      padding: 0.875rem 1rem;
      margin-bottom: 1rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .pricing-note {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      line-height: 1.6;
      max-width: 44ch;
    }
  `,
})
export class HomeComponent {
  protected readonly steps: Step[] = [
    { number: '01', title: 'Book',
      body: 'Pick a time that works in your zone. No sign-up, no account. Pay upfront, no surprises.' },
    { number: '02', title: 'Connect',
      body: 'Join your private session at your scheduled time, from anywhere.' },
    { number: '03', title: 'Talk & be heard',
      body: "Share whatever's on your mind. You set the pace — your listening companion listens." },
  ];

  protected readonly topics: Topic[] = [
    { label: 'A rough day'                       },
    { label: 'Good news to share'                },
    { label: 'Work stuff'                        },
    { label: 'Feeling lonely'                    },
    { label: 'Missing home'                      },
    { label: 'Family & relationships'            },
    { label: 'Overthinking'                      },
    { label: "Something you've never told anyone" },
    { label: 'Just wanting to talk'              },
  ];
}

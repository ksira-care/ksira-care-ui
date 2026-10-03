import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface SessionDetail {
  text: string;
}

interface Topic {
  label: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page header -->
    <section class="page-header section" aria-labelledby="services-heading">
      <div class="container">
        <span class="section-label">Our Services</span>
        <h1 id="services-heading" class="services__title">
          One hour. Just for you.
        </h1>
        <p class="section-body">
          A 60-minute one-to-one conversation with a listening companion. You
          talk, they listen — no scripts, no assignments, no judgement.
        </p>
      </div>
    </section>

    <hr class="divider" />

    <!-- Session details -->
    <section class="section" aria-labelledby="session-heading">
      <div class="container services-grid">
        <div>
          <h2 id="session-heading" class="services__h2">
            What a session looks like
          </h2>
          <ul class="session-list" role="list" aria-label="Session details">
            @for (detail of sessionDetails; track detail.text) {
              <li class="session-item">
                <span class="session-item__dot" aria-hidden="true"></span>
                {{ detail.text }}
              </li>
            }
          </ul>
        </div>

        <div class="services__card" aria-label="Session summary">
          <div class="services__card-badge">
            <span>60 min</span>
          </div>
          <p class="services__card-title">A conversation that's all yours</p>
          <ul class="services__card-meta" aria-label="Session features">
            <li>🌐 Worldwide, video or voice</li>
            <li>🕐 Your timezone, your schedule</li>
            <li>🔒 Private, never recorded</li>
          </ul>
        </div>
      </div>
    </section>

    <hr class="divider" />

    <!-- Topics -->
    <section
      class="section section--muted"
      aria-labelledby="topics-heading"
    >
      <div class="container">
        <h2 id="topics-heading" class="services__h2">
          What you can talk about
        </h2>
        <ul class="topics" role="list" aria-label="Topics you can talk about">
          @for (topic of topics; track topic.label) {
            <li class="tag">{{ topic.label }}</li>
          }
        </ul>
        <p class="services__topics-note">
          There's no "too small" or "too much." If it matters to you, it
          matters in session.
        </p>
      </div>
    </section>

    <hr class="divider" />

    <!-- Boundary -->
    <section class="section" aria-labelledby="boundary-heading">
      <div class="container">
        <div class="boundary-card" role="note" aria-labelledby="boundary-heading">
          <span class="boundary-card__icon" aria-hidden="true">⚠️</span>
          <div>
            <h2 id="boundary-heading" class="services__h2 boundary-card__title">
              An important boundary
            </h2>
            <p class="services__body">
              Ksira Care is a private conversation service, not a mental health
              service. We don't diagnose or provide treatment of any kind, and
              we're not a substitute for therapy, counselling or medical care.
              If you're looking for clinical support, please reach out to a
              qualified professional in your area. If you're in crisis, please
              contact your local emergency services.
            </p>
          </div>
        </div>
      </div>
    </section>

    <hr class="divider" />

    <!-- Pricing CTA -->
    <section class="section" aria-labelledby="pricing-heading">
      <div class="container services-pricing">
        <span class="section-label">Pricing</span>
        <h2 id="pricing-heading" class="services__pricing-title">Simple pricing.</h2>
        <p class="services__pricing-sub">One session, one price. No subscriptions.</p>

        <div class="services__pricing-card">
          <p class="services__price" aria-label="899 rupees">
            <span class="services__price-dollar" aria-hidden="true">₹</span>899
          </p>
          <p class="services__price-unit">per 60-minute session</p>
          <a routerLink="/book" class="btn btn-primary services__price-btn">
            Book a Session
          </a>
          <p class="services__price-note">
            Paid upfront. We'll only ever email you your booking confirmation
            and session link. Nothing else.
          </p>
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

    .services__title {
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

    .services__h2 {
      font-family: var(--font-sans);
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 600;
      color: var(--color-green);
      margin-bottom: var(--space-xl);
    }

    .services__body {
      font-size: 1.0625rem;
      color: var(--color-text-muted);
      max-width: 65ch;
    }

    .services-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: start;
      gap: var(--space-3xl);

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
        gap: var(--space-2xl);
      }
    }

    /* Session list */
    .session-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      font-size: 1.0625rem;
      color: var(--color-text-muted);
    }

    .session-item__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-cta);
      flex-shrink: 0;
    }

    /* Card */
    .services__card {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
      box-shadow: var(--shadow-md);
    }

    .services__card-badge {
      display: inline-flex;
      margin-bottom: var(--space-md);

      span {
        background-color: rgba(44, 95, 74, 0.1);
        color: var(--color-cta);
        font-size: 0.875rem;
        font-weight: 600;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
      }
    }

    .services__card-title {
      font-family: var(--font-sans);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-green);
      margin-bottom: var(--space-lg);
    }

    .services__card-meta {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);

      li {
        font-size: 0.9375rem;
        color: var(--color-text-muted);
      }
    }

    /* Topics */
    .section--muted {
      background-color: var(--color-surface-muted);
    }

    .topics {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
      margin-bottom: var(--space-xl);
    }

    .services__topics-note {
      font-size: 1.0625rem;
      color: var(--color-text-muted);
      font-style: italic;
    }

    /* Boundary */
    .boundary-card {
      display: flex;
      align-items: flex-start;
      gap: var(--space-lg);
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
    }

    .boundary-card__icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .boundary-card__title {
      margin-bottom: var(--space-sm);
      font-size: 1.25rem;
    }

    /* Pricing CTA */
    .services-pricing {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .services__pricing-title {
      font-family: var(--font-sans);
      font-size: clamp(1.75rem, 3.5vw, 2.25rem);
      font-weight: 600;
      color: var(--color-green);
      margin-bottom: 0.5rem;
    }

    .services__pricing-sub {
      font-size: 1rem;
      color: var(--color-text-muted);
      margin-bottom: 2.5rem;
    }

    .services__pricing-card {
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

    .services__price {
      font-family: var(--font-sans);
      font-size: 4rem;
      font-weight: 600;
      color: var(--color-green);
      line-height: 1;
      letter-spacing: -0.02em;
      margin-bottom: 0.375rem;
    }

    .services__price-dollar {
      font-size: 1.75rem;
      font-weight: 700;
      vertical-align: top;
      line-height: 1.3;
      margin-right: 2px;
    }

    .services__price-unit {
      font-size: 0.9375rem;
      color: var(--color-text-muted);
      margin-bottom: 1.5rem;
    }

    .services__price-btn {
      width: 100%;
      max-width: 220px;
      padding: 0.875rem 1rem;
      margin-bottom: 1rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .services__price-note {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      line-height: 1.6;
      max-width: 44ch;
    }
  `,
})
export class ServicesComponent {
  protected readonly sessionDetails: SessionDetail[] = [
    { text: 'A private 60-minute video or voice call' },
    { text: 'Booked at a time that suits your zone' },
    { text: 'Begins with a gentle check-in' },
    { text: 'You lead the conversation, at your pace' },
    { text: 'Ends with a gentle close — no homework' },
  ];

  protected readonly topics: Topic[] = [
    { label: 'A rough day' },
    { label: 'Good news to share' },
    { label: 'Work stuff' },
    { label: 'Feeling lonely' },
    { label: 'Missing home' },
    { label: 'Family & relationships' },
    { label: 'Overthinking' },
    { label: "Something you've never told anyone" },
    { label: 'Just wanting to talk' },
  ];
}

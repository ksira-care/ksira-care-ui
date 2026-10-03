import { ChangeDetectionStrategy, Component } from '@angular/core';

interface PolicySection {
  id: string;
  heading: string;
  body: string;
}

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" aria-labelledby="privacy-heading">
      <div class="container legal-layout">
        <header class="legal-header">
          <span class="section-label">Legal</span>
          <h1 id="privacy-heading" class="section-title">Privacy Policy</h1>
          <p class="legal-note">
            This is a placeholder policy. Replace with a lawyer-reviewed or
            generator-made policy before launch.
          </p>
        </header>

        <div class="legal-content">
          @for (sec of sections; track sec.id) {
            <section class="legal-section" [attr.aria-labelledby]="sec.id">
              <h2 [id]="sec.id" class="legal-section__heading">
                {{ sec.heading }}
              </h2>
              <p class="legal-section__body">{{ sec.body }}</p>
            </section>
          }

          <section class="legal-section" aria-labelledby="privacy-contact">
            <h2 id="privacy-contact" class="legal-section__heading">Contact</h2>
            <p class="legal-section__body">
              Questions about privacy? Reach out at
              <a href="mailto:hello@ksiracare.example" class="legal-link">
                hello&#64;ksiracare.example
              </a>.
            </p>
          </section>
        </div>
      </div>
    </section>
  `,
  styles: `
    .legal-layout {
      max-width: 720px;
    }

    .legal-header {
      margin-bottom: var(--space-2xl);
    }

    .legal-note {
      margin-top: var(--space-md);
      font-size: 0.875rem;
      color: var(--color-accent);
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: var(--radius-md);
      padding: var(--space-sm) var(--space-md);
      display: inline-block;
    }

    .legal-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-2xl);
    }

    .legal-section__heading {
      font-family: var(--font-serif);
      font-size: 1.25rem;
      color: var(--color-text);
      margin-bottom: var(--space-sm);
    }

    .legal-section__body {
      font-size: 1rem;
      color: var(--color-text-muted);
      line-height: 1.8;
    }

    .legal-link {
      color: var(--color-cta);
      text-decoration: underline;

      &:hover {
        color: var(--color-cta-hover);
      }

      &:focus-visible {
        outline: 2px solid var(--color-cta);
        outline-offset: 2px;
        border-radius: 2px;
      }
    }
  `,
})
export class PrivacyComponent {
  protected readonly sections: PolicySection[] = [
    {
      id: 'privacy-collect',
      heading: 'Information we collect',
      body: 'When you book a session, we collect your name, email address, time zone, and any notes you choose to share in the intake form.',
    },
    {
      id: 'privacy-use',
      heading: 'How we use it',
      body: 'We use your information only to schedule and deliver your session, email you your booking confirmation and session link, and process payment via our payment provider. We never send marketing emails.',
    },
    {
      id: 'privacy-stored',
      heading: "How it's stored",
      body: 'Your information is stored securely. Intake notes are accessible only to your listening companion and are kept for the limited time needed to support your session.',
    },
    {
      id: 'privacy-share',
      heading: 'We do not sell or share your data',
      body: 'We never sell or rent your information. We do not share it with third parties except as required to deliver the service (e.g. payment processing, scheduling) or by law.',
    },
    {
      id: 'privacy-rights',
      heading: 'Your rights (including GDPR)',
      body: 'You have the right to access, correct, or delete the personal information we hold about you, and to withdraw consent at any time. To make a request, email us at hello@ksiracare.example.',
    },
  ];
}

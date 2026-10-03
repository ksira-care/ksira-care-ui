import { ChangeDetectionStrategy, Component } from '@angular/core';

interface TermsSection {
  heading: string;
  body: string;
}

@Component({
  selector: 'app-terms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" aria-labelledby="terms-heading">
      <div class="container legal-layout">
        <header class="legal-header">
          <span class="section-label">Legal</span>
          <h1 id="terms-heading" class="section-title">Terms of Service</h1>
          <p class="legal-note">
            This is a placeholder. Replace with a lawyer-reviewed version before
            launch.
          </p>
        </header>

        <div class="legal-content">
          @for (sec of sections; track sec.heading) {
            <section class="legal-section">
              <h2 class="legal-section__heading">{{ sec.heading }}</h2>
              <p class="legal-section__body">{{ sec.body }}</p>
            </section>
          }
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
  `,
})
export class TermsComponent {
  protected readonly sections: TermsSection[] = [
    {
      heading: 'Nature of the service',
      body: 'Ksira Care provides private, one-to-one conversations with a listening companion. It is not therapy, counselling, medical treatment, or crisis support, and it is not a substitute for any of those.',
    },
    {
      heading: 'Payment',
      body: 'Sessions are paid upfront at the time of booking. Prices are shown in Indian rupees (₹). Payment is processed by our third-party payment provider.',
    },
    {
      heading: 'Cancellations and rescheduling',
      body: 'You may cancel or reschedule up to 24 hours before your session for a full refund or free reschedule. Within 24 hours, refunds are at our discretion.',
    },
    {
      heading: 'No-shows',
      body: "If you don't join within 15 minutes of your scheduled time, the session is treated as a no-show and is non-refundable.",
    },
    {
      heading: 'Crisis and safety',
      body: 'If you are in crisis or in danger, please contact local emergency services or a crisis helpline immediately. Ksira Care cannot respond to emergencies.',
    },
    {
      heading: 'Changes',
      body: 'We may update these terms from time to time. Continued use of the service means you accept the updated terms.',
    },
  ];
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { formatLanguages } from '../bookings/booking-format';
import { LoadErrorComponent } from '../ui/load-error.component';
import { formatAddress, formatBirthDate, formatPhone } from './profile-format';
import { ProfileGateway } from './profile.gateway';

interface FieldView {
  readonly label: string;
  /** `null` shows "Not provided". */
  readonly value: string | null;
  /** Spans both columns. */
  readonly wide?: boolean;
  /** Masked until the therapist chooses to show it. */
  readonly revealable?: boolean;
}

const NOT_PROVIDED = 'Not provided';

/**
 * The therapist's private details, read-only. Changes go through their
 * coordinator until Product decides which fields therapists may edit.
 */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [LoadErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="profile__header">
      <h1 class="section-title profile__title">Your profile</h1>
      <p class="profile__intro">
        Ksira Care keeps these details private. Only your coordinator can see them.
      </p>
    </header>

    <section class="card" aria-labelledby="personal-heading">
      <h2 class="card__title" id="personal-heading">Personal details</h2>

      @if (profile.hasValue()) {
        <dl class="fields">
          @for (field of fields(); track field.label) {
            <div class="field" [class.field--wide]="field.wide">
              <dt class="field__label">{{ field.label }}</dt>
              <dd
                class="field__value"
                [class.field__value--empty]="!field.value"
                [class.field__value--revealable]="field.revealable && field.value"
              >
                <span>{{ field.value ?? notProvided }}</span>
                @if (field.revealable && field.value) {
                  <button
                    type="button"
                    class="field__reveal"
                    [attr.aria-pressed]="phoneVisible()"
                    [attr.aria-label]="'Show ' + field.label.toLowerCase()"
                    (click)="phoneVisible.set(!phoneVisible())"
                  >
                    {{ phoneVisible() ? 'Hide' : 'Show' }}
                  </button>
                }
              </dd>
            </div>
          }
        </dl>

        <p class="card__note">To change any of these details, contact your coordinator.</p>
      } @else if (profile.error()) {
        <app-load-error message="We couldn't load your profile." (retry)="profile.reload()" />
      } @else {
        <div class="fields" aria-busy="true">
          <span class="visually-hidden">Loading your profile…</span>
          @for (slot of skeletonFields; track slot) {
            <div class="skeleton profile__skeleton" aria-hidden="true"></div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      max-width: 52rem;
      padding-block: var(--space-2xl);
    }

    .profile__header { margin-bottom: var(--space-xl); }
    .profile__title { margin-bottom: var(--space-xs); }
    .profile__intro { color: var(--color-text-muted); }

    .card {
      padding: var(--space-xl);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);

      @media (max-width: 640px) { padding: var(--space-lg); }
    }

    .card__title {
      margin-bottom: var(--space-lg);
      font-family: var(--font-serif);
      font-size: 1.375rem;
      font-weight: normal;
    }

    .fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-md);

      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }

    .field {
      min-width: 0;
      padding: 0.75rem var(--space-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .field--wide { grid-column: 1 / -1; }

    .field__label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    .field__value {
      margin-top: 0.125rem;
      overflow-wrap: anywhere;
      color: var(--color-text);
    }

    .field__value--empty { color: var(--color-text-subtle); }

    .field__value--revealable {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-sm);
      font-variant-numeric: tabular-nums;
    }

    .field__reveal {
      padding: 0.125rem 0.375rem;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-green);
      cursor: pointer;

      &:hover { text-decoration: underline; }
      &:focus-visible { outline: 2px solid var(--color-green); outline-offset: 1px; }
    }

    .profile__skeleton {
      height: 66px;
      border-radius: var(--radius-md);
    }

    .card__note {
      margin-top: var(--space-lg);
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

  `,
})
export class ProfilePageComponent {
  private readonly gateway = inject(ProfileGateway);

  protected readonly notProvided = NOT_PROVIDED;
  protected readonly skeletonFields = [0, 1, 2, 3, 4, 5];
  protected readonly phoneVisible = signal(false);

  protected readonly profile = rxResource({ stream: () => this.gateway.getProfile() });

  protected readonly fields = computed<FieldView[]>(() => {
    if (!this.profile.hasValue()) return [];
    const profile = this.profile.value();
    return [
      { label: 'Full name', value: profile.fullName || null },
      { label: 'Email', value: profile.email || null },
      {
        label: 'Phone',
        value: profile.phone ? formatPhone(profile.phone, { masked: !this.phoneVisible() }) : null,
        revealable: true,
      },
      {
        label: 'Date of birth',
        value: profile.dateOfBirth ? formatBirthDate(profile.dateOfBirth) : null,
      },
      // Full width (like Address) so the two-column grid has no empty slot.
      { label: 'Languages', value: formatLanguages(profile.languages) || null, wide: true },
      {
        label: 'Address',
        value: profile.address ? formatAddress(profile.address) || null : null,
        wide: true,
      },
    ];
  });
}

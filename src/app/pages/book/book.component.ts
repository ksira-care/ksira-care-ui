import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CalendarPickerComponent,
  CalendarSelection,
} from '../../shared/calendar-picker/calendar-picker.component';

type BookingStep = 'form' | 'success';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns the browser's IANA time zone string (e.g. "Europe/London"). */
function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return '';
  }
}

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CalendarPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Crisis banner -->
    <div class="crisis-banner" role="alert" aria-live="polite">
      <div class="container crisis-banner__inner">
        <strong>If you are in crisis or in danger:</strong>
        Please contact your local emergency services or a crisis helpline
        immediately. Ksira Care cannot provide emergency support.
      </div>
    </div>

    <section class="section" aria-labelledby="book-heading">
      <div class="container book-layout">

        @if (step() === 'form') {
          <div class="book-header">
            <span class="section-label">Book Now</span>
            <h1 id="book-heading" class="section-title">
              Schedule your session.
            </h1>
            <p class="section-body">
              A 60-minute one-to-one conversation. ₹899, paid upfront. Choose a
              time that works in your zone.
            </p>
          </div>

          <form
            [formGroup]="bookingForm"
            (ngSubmit)="onSubmit()"
            class="book-form"
            novalidate
            aria-label="Session booking form"
          >
            <!-- Step 1: Pick a time -->
            <fieldset class="form-section">
              <legend class="form-section__legend">
                <span class="form-section__number" aria-hidden="true">1</span>
                Pick a time
              </legend>

              <app-calendar-picker
                (selectionChange)="onCalendarChange($event)"
              />

              @if (calendarTouched() && !selectedSlot()) {
                <span class="form-error" role="alert">
                  Please select a date and time before continuing.
                </span>
              }
            </fieldset>

            <!-- Step 2: Tell us about you -->
            <fieldset class="form-section">
              <legend class="form-section__legend">
                <span class="form-section__number" aria-hidden="true">2</span>
                Tell us a little about you
              </legend>

              <div class="form-row">
                <!-- Name -->
                <div class="form-group">
                  <label for="name" class="form-label">
                    Your name
                    <span class="required" aria-label="required">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    formControlName="name"
                    class="form-control"
                    [class.invalid]="isInvalid('name')"
                    placeholder="Jane Smith"
                    autocomplete="name"
                    [attr.aria-describedby]="isInvalid('name') ? 'name-error' : null"
                    [attr.aria-invalid]="isInvalid('name')"
                  />
                  @if (isInvalid('name')) {
                    <span id="name-error" class="form-error" role="alert">
                      {{ getError('name') }}
                    </span>
                  }
                </div>

                <!-- Email -->
                <div class="form-group">
                  <label for="email" class="form-label">
                    Email
                    <span class="required" aria-label="required">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    class="form-control"
                    [class.invalid]="isInvalid('email')"
                    placeholder="jane@example.com"
                    autocomplete="email"
                    inputmode="email"
                    [attr.aria-describedby]="isInvalid('email') ? 'email-error' : null"
                    [attr.aria-invalid]="isInvalid('email')"
                  />
                  @if (isInvalid('email')) {
                    <span id="email-error" class="form-error" role="alert">
                      {{ getError('email') }}
                    </span>
                  }
                </div>
              </div>

              <!-- Timezone -->
              <div class="form-group">
                <label for="timezone" class="form-label">
                  Time zone
                  <span class="required" aria-label="required">*</span>
                </label>
                <select
                  id="timezone"
                  formControlName="timezone"
                  class="form-control"
                  [class.invalid]="isInvalid('timezone')"
                  [attr.aria-describedby]="isInvalid('timezone') ? 'timezone-error' : null"
                  [attr.aria-invalid]="isInvalid('timezone')"
                >
                  <option value="" disabled>Select your time zone</option>
                  @for (tz of timezones; track tz.value) {
                    <option [value]="tz.value">{{ tz.label }}</option>
                  }
                </select>
                @if (isInvalid('timezone')) {
                  <span id="timezone-error" class="form-error" role="alert">
                    Please select your time zone.
                  </span>
                }
              </div>

              <!-- Notes -->
              <div class="form-group">
                <label for="notes" class="form-label">
                  What would you like from this session?
                  <span class="form-label-hint">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  formControlName="notes"
                  class="form-control"
                  rows="4"
                  placeholder="You don't have to share anything here — it's entirely optional."
                  maxlength="500"
                  [attr.aria-describedby]="'notes-hint'"
                ></textarea>
                <span id="notes-hint" class="form-hint">
                  {{ bookingForm.get('notes')?.value?.length ?? 0 }} / 500
                </span>
              </div>

              <!-- Consent -->
              <div class="form-group consent-group">
                <label class="consent-label" [class.invalid]="isInvalid('consent')">
                  <input
                    type="checkbox"
                    formControlName="consent"
                    class="consent-checkbox"
                    [attr.aria-describedby]="isInvalid('consent') ? 'consent-error' : null"
                    [attr.aria-invalid]="isInvalid('consent')"
                  />
                  <span>
                    I understand that Ksira Care offers private conversations
                    with a listening companion only — not therapy, counselling,
                    medical advice or crisis support.
                    <span class="required" aria-label="required">*</span>
                  </span>
                </label>
                @if (isInvalid('consent')) {
                  <span id="consent-error" class="form-error" role="alert">
                    You must accept this to continue.
                  </span>
                }
              </div>
            </fieldset>

            <!-- Step 3: Pay -->
            <fieldset class="form-section">
              <legend class="form-section__legend">
                <span class="form-section__number" aria-hidden="true">3</span>
                Pay and confirm
              </legend>

              <div class="payment-summary" role="group" aria-label="Payment summary">
                <div class="payment-summary__row">
                  <span>60-minute session</span>
                  <span class="payment-summary__price">₹899</span>
                </div>
                <div class="payment-placeholder" aria-label="Payment form placeholder">
                  <span aria-hidden="true">💳</span>
                  <p>Stripe / PayPal integration</p>
                  <p class="payment-placeholder__sub">
                    Secure payment form appears here
                  </p>
                </div>
              </div>

              <button
                type="submit"
                class="btn btn-primary submit-btn"
                [disabled]="isSubmitting()"
                [attr.aria-busy]="isSubmitting()"
              >
                @if (isSubmitting()) {
                  <span class="spinner" aria-hidden="true"></span>
                  Processing…
                } @else {
                  Pay ₹899 and Book
                }
              </button>

              <p class="payment-note">
                Payment is processed securely. You'll receive a confirmation email.
              </p>
            </fieldset>
          </form>
        }

        @if (step() === 'success') {
          <div class="success-state" role="status" aria-live="polite" aria-labelledby="success-heading">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h1 id="success-heading" class="success-state__title">
              You're booked.
            </h1>
            <p class="success-state__body">
              A confirmation has been sent to
              <strong>{{ confirmedEmail() }}</strong>. See you soon.
            </p>
            <a routerLink="/" class="btn btn-outline" style="margin-top:1.5rem">
              Back to home
            </a>
          </div>
        }

        <!-- Sidebar trust signals -->
        <aside class="book-aside" aria-label="Session details">
          <div class="trust-card">
            <h2 class="trust-card__title">Session details</h2>
            <ul class="trust-list" role="list">
              <li>
                <span aria-hidden="true">⏱</span>
                <span>60-minute session</span>
              </li>
              <li>
                <span aria-hidden="true">💰</span>
                <span>₹899, paid upfront</span>
              </li>
              <li>
                <span aria-hidden="true">🌐</span>
                <span>Video or voice, from anywhere</span>
              </li>
              <li>
                <span aria-hidden="true">🔒</span>
                <span>Private, never recorded</span>
              </li>
              <li>
                <span aria-hidden="true">↩️</span>
                <span>Full refund if cancelled 24h+ before</span>
              </li>
            </ul>
          </div>

          <div class="trust-card trust-card--note" role="note">
            <p>
              Ksira Care is a private conversation service — not therapy or
              medical care. If you're in crisis, please contact your local
              emergency services.
            </p>
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: `
    /* Crisis banner */
    .crisis-banner {
      background-color: var(--color-crisis-bg);
      border-bottom: 1px solid var(--color-crisis-border);
      color: var(--color-crisis);
    }

    .crisis-banner__inner {
      padding-block: 0.75rem;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    /* Book layout */
    .book-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      grid-template-rows: auto 1fr;
      column-gap: var(--space-3xl);
      row-gap: var(--space-xl);

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .book-header {
      grid-column: 1;
    }

    .book-form,
    .success-state {
      grid-column: 1;
    }

    .book-aside {
      grid-column: 2;
      grid-row: 1 / 3;
      position: sticky;
      top: calc(var(--nav-height) + var(--space-xl));
      align-self: start;
      display: flex;
      flex-direction: column;
      gap: var(--space-md);

      @media (max-width: 900px) {
        grid-column: 1;
        grid-row: auto;
        position: static;
      }
    }

    /* Form sections */
    .book-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
    }

    .form-section {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }

    .form-section__legend {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-family: var(--font-serif);
      font-size: 1.25rem;
      color: var(--color-text);
      padding: 0 var(--space-sm);
    }

    .form-section__number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background-color: var(--color-cta);
      color: white;
      border-radius: 50%;
      font-family: var(--font-sans);
      font-size: 0.8125rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-lg);

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .form-label-hint {
      font-weight: normal;
      color: var(--color-text-muted);
      font-size: 0.875rem;
      margin-left: 4px;
    }

    .form-hint {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      text-align: right;
    }

    /* ── Calendar section wrapper ── */
    /* The calendar component handles its own internal styles.
       We just need a clean container inside the fieldset. */

    /* Consent */
    .consent-group {
      gap: var(--space-sm) !important;
    }

    .consent-label {
      display: flex;
      align-items: flex-start;
      gap: var(--space-sm);
      font-size: 0.9375rem;
      color: var(--color-text-muted);
      cursor: pointer;
      line-height: 1.6;

      &.invalid {
        color: var(--color-crisis);
      }
    }

    .consent-checkbox {
      margin-top: 3px;
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      accent-color: var(--color-cta);
      cursor: pointer;
    }

    /* Payment */
    .payment-summary {
      background-color: var(--color-surface-muted);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .payment-summary__row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-md) var(--space-lg);
      font-size: 0.9375rem;
      border-bottom: 1px solid var(--color-border);
    }

    .payment-summary__price {
      font-weight: 600;
      color: var(--color-text);
    }

    .payment-placeholder {
      padding: var(--space-xl);
      text-align: center;
      color: var(--color-text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-xs);
      font-size: 0.9375rem;
    }

    .payment-placeholder__sub {
      font-size: 0.8125rem;
    }

    .submit-btn {
      width: 100%;
      padding: 0.875rem;
      font-size: 1rem;
      gap: var(--space-sm);
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .payment-note {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      text-align: center;
    }

    /* Aside */
    .trust-card {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
    }

    .trust-card--note {
      background-color: var(--color-surface-muted);
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .trust-card__title {
      font-family: var(--font-serif);
      font-size: 1rem;
      color: var(--color-text);
      margin-bottom: var(--space-md);
    }

    .trust-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;

      li {
        display: flex;
        align-items: flex-start;
        gap: var(--space-sm);
        font-size: 0.875rem;
        color: var(--color-text-muted);
      }
    }

    /* Success state */
    .success-state {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding-block: var(--space-xl);
    }

    .success-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background-color: rgba(44, 95, 74, 0.12);
      color: var(--color-cta);
      border-radius: 50%;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: var(--space-lg);
    }

    .success-state__title {
      font-family: var(--font-serif);
      font-size: 2rem;
      color: var(--color-text);
      margin-bottom: var(--space-md);
    }

    .success-state__body {
      font-size: 1.0625rem;
      color: var(--color-text-muted);
    }
  `,
})
export class BookComponent implements OnInit {
  protected readonly step            = signal<BookingStep>('form');
  protected readonly isSubmitting    = signal(false);
  protected readonly confirmedEmail  = signal('');
  protected readonly selectedSlot    = signal<CalendarSelection | null>(null);
  protected readonly calendarTouched = signal(false);

  protected bookingForm!: FormGroup;

  protected readonly timezones = [
    { value: 'Pacific/Midway', label: '(UTC-11:00) Midway Island' },
    { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
    { value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },
    { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)' },
    { value: 'America/Denver', label: '(UTC-07:00) Mountain Time (US & Canada)' },
    { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)' },
    { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },
    { value: 'America/Halifax', label: '(UTC-04:00) Atlantic Time (Canada)' },
    { value: 'America/Argentina/Buenos_Aires', label: '(UTC-03:00) Buenos Aires' },
    { value: 'Atlantic/South_Georgia', label: '(UTC-02:00) South Georgia' },
    { value: 'Atlantic/Cape_Verde', label: '(UTC-01:00) Cape Verde' },
    { value: 'Europe/London', label: '(UTC+00:00) London, Dublin' },
    { value: 'Europe/Paris', label: '(UTC+01:00) Paris, Berlin, Rome' },
    { value: 'Europe/Helsinki', label: '(UTC+02:00) Helsinki, Athens' },
    { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow, Riyadh' },
    { value: 'Asia/Dubai', label: '(UTC+04:00) Dubai, Abu Dhabi' },
    { value: 'Asia/Karachi', label: '(UTC+05:00) Karachi, Islamabad' },
    { value: 'Asia/Kolkata', label: '(UTC+05:30) Mumbai, New Delhi' },
    { value: 'Asia/Dhaka', label: '(UTC+06:00) Dhaka' },
    { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok, Jakarta' },
    { value: 'Asia/Shanghai', label: '(UTC+08:00) Beijing, Singapore' },
    { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo, Seoul' },
    { value: 'Australia/Sydney', label: '(UTC+10:00) Sydney, Melbourne' },
    { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland' },
  ];

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    const detectedTz = getBrowserTimezone();
    const matchedTz = this.timezones.find((tz) => tz.value === detectedTz)?.value ?? '';

    this.bookingForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
      timezone: [matchedTz, Validators.required],
      notes: ['', Validators.maxLength(500)],
      consent: [false, Validators.requiredTrue],
    });
  }

  protected onCalendarChange(sel: CalendarSelection | null): void {
    this.selectedSlot.set(sel);
    if (sel) this.calendarTouched.set(true);
  }

  protected isInvalid(field: string): boolean {
    const ctrl = this.bookingForm.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  protected getError(field: string): string {
    const ctrl = this.bookingForm.get(field);
    if (!ctrl?.errors) return '';

    if (field === 'name') {
      if (ctrl.errors['required']) return 'Name is required.';
      if (ctrl.errors['minlength']) return 'Name must be at least 2 characters.';
      if (ctrl.errors['maxlength']) return 'Name is too long.';
    }

    if (field === 'email') {
      if (ctrl.errors['required']) return 'Email is required.';
      if (ctrl.errors['pattern']) return 'Please enter a valid email address.';
    }

    return 'This field is required.';
  }

  protected onSubmit(): void {
    this.bookingForm.markAllAsTouched();
    this.calendarTouched.set(true);

    if (this.bookingForm.invalid || !this.selectedSlot() || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    // Simulate async payment + booking submission
    const email = this.bookingForm.get('email')!.value as string;

    setTimeout(() => {
      this.confirmedEmail.set(email);
      this.step.set('success');
      this.isSubmitting.set(false);
      // Scroll to top of section smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1500);
  }
}

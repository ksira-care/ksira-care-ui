import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, of } from 'rxjs';
import { ApiError } from '../../core/http/api-error';
import { LanguagesGateway } from '../../core/languages/languages.gateway';
import { DAY_MS, PORTAL_TIME_ZONE } from '../../core/time/portal-time';
import { BookingGateway } from '../../features/booking/booking.gateway';
import {
  BookingConfirmation,
  LOOKAHEAD_DAYS,
  NAME_LENGTH,
  NOTES_MAX,
} from '../../features/booking/booking.models';
import { CalendarPickerComponent } from '../../shared/calendar-picker/calendar-picker.component';
import { LanguagePickerComponent } from '../../shared/ui/language-picker.component';
import { LoadErrorComponent } from '../../shared/ui/load-error.component';
import { LoadingRowsComponent } from '../../shared/ui/loading-rows.component';
import { environment } from '../../../environments/environment';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRICE = '₹899';

/** Why booking failed, in words the client can act on. */
const FAILURES: Readonly<Record<string, string>> = {
  TIME_NOT_AVAILABLE: 'Sorry, that time was just taken. Please pick another.',
  INVALID_SLOT_TIME: "That time can't be booked any more. Please pick another.",
  RATE_LIMITED: "You've made several bookings in a short time. Please try again in an hour.",
  NETWORK: "We couldn't reach our server. Check your connection and try again.",
};

const longDay = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: PORTAL_TIME_ZONE });
/** "11:00 AM", as on the time buttons. */
const clockTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: PORTAL_TIME_ZONE });

/** The visitor's own clock, for those outside India. */
const localWhen = new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

/** India is UTC+5:30 all year, so this compares any moment's offset with it. */
const IST_OFFSET_MINUTES = -330;

/**
 * Booking a session: the client picks the languages they're comfortable in —
 * which decides the free times — then a time, tells us a little about
 * themselves, and confirms. The booking arrives for an admin to give to an
 * aapta. Payment (Razorpay) is switched off for now (`paymentsEnabled`), so
 * confirming books straight away.
 */
@Component({
  selector: 'app-book',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CalendarPickerComponent,
    LanguagePickerComponent,
    LoadErrorComponent,
    LoadingRowsComponent,
  ],
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

        @if (confirmation(); as booked) {
          <div class="success-state" role="status" aria-live="polite" aria-labelledby="success-heading">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h1 id="success-heading" class="success-state__title">You're booked.</h1>
            <p class="success-state__body">
              <strong>{{ when(booked.start) }} IST</strong>. We'll email the video link to
              <strong>{{ bookedEmail() }}</strong> before your session.
            </p>
            <a routerLink="/" class="btn btn-outline success-state__home">Back to home</a>
          </div>
        } @else {
          <div class="book-header">
            <span class="section-label">Book Now</span>
            <h1 id="book-heading" class="section-title">Schedule your session.</h1>
            <p class="section-body">
              A 60-minute one-to-one conversation. {{ price }}, paid upfront. Choose
              the languages you're comfortable in and a time that suits you.
            </p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="book-form" novalidate aria-label="Session booking form">
            <!-- Step 1: languages and a time -->
            <fieldset class="form-section">
              <legend class="form-section__legend">
                <span class="form-section__number" aria-hidden="true">1</span>
                Pick a time
              </legend>

              <div class="form-group book-languages">
                <span class="form-label" id="book-languages-label">
                  Which languages are you comfortable speaking? <span class="required" aria-hidden="true">*</span>
                </span>
                @if (languages.hasValue()) {
                  <app-language-picker
                    [languages]="languages.value()"
                    formControlName="languages"
                    labelledBy="book-languages-label"
                    [describedBy]="isInvalid('languages') ? 'book-languages-error' : null"
                  />
                } @else if (languages.error()) {
                  <app-load-error message="We couldn't load the languages." (retry)="languages.reload()" />
                } @else {
                  <app-loading-rows label="Loading languages…" [rows]="1" />
                }
                @if (isInvalid('languages')) {
                  <span id="book-languages-error" class="form-error" role="alert">Choose at least one language.</span>
                }
              </div>

              @if (!chosenLanguages().length) {
                <p class="book-empty">Choose a language to see the times we're free.</p>
              } @else if (hours.hasValue()) {
                @if (hours.value().length) {
                  <app-calendar-picker [hours]="hours.value()" [selected]="start()" (selectedChange)="start.set($event)" />
                  <p class="book-zone">
                    All times are India time (IST).
                    @if (localEquivalent(); as local) { That's <strong>{{ local }}</strong> where you are. }
                  </p>
                } @else {
                  <p class="book-empty">
                    No free times in the next {{ lookaheadDays }} days for these languages. Try adding another
                    language, or check back soon.
                  </p>
                }
              } @else if (hours.error()) {
                <app-load-error message="We couldn't load the free times." (retry)="hours.reload()" />
              } @else {
                <app-loading-rows label="Finding free times…" [rows]="3" />
              }

              @if (attempted() && !start()) {
                <span class="form-error" role="alert">Please pick a date and time.</span>
              }
            </fieldset>

            <!-- Step 2: Tell us about you -->
            <fieldset class="form-section">
              <legend class="form-section__legend">
                <span class="form-section__number" aria-hidden="true">2</span>
                Tell us a little about you
              </legend>

              <div class="form-row">
                <div class="form-group">
                  <label for="name" class="form-label">Your name <span class="required" aria-hidden="true">*</span></label>
                  <input id="name" type="text" formControlName="name" class="form-control" autocomplete="name"
                         placeholder="Jane Smith" [attr.maxlength]="nameMax"
                         [class.invalid]="isInvalid('name')" [attr.aria-invalid]="isInvalid('name')"
                         [attr.aria-describedby]="isInvalid('name') ? 'name-error' : null" />
                  @if (isInvalid('name')) {
                    <span id="name-error" class="form-error" role="alert">Please enter your name ({{ nameMin }} or more letters).</span>
                  }
                </div>

                <div class="form-group">
                  <label for="email" class="form-label">Email <span class="required" aria-hidden="true">*</span></label>
                  <input id="email" type="email" formControlName="email" class="form-control" autocomplete="email"
                         inputmode="email" placeholder="jane@example.com"
                         [class.invalid]="isInvalid('email')" [attr.aria-invalid]="isInvalid('email')"
                         [attr.aria-describedby]="isInvalid('email') ? 'email-error' : 'email-hint'" />
                  @if (isInvalid('email')) {
                    <span id="email-error" class="form-error" role="alert">Please enter a valid email address.</span>
                  } @else {
                    <span id="email-hint" class="form-label-hint">We'll send the video link here.</span>
                  }
                </div>
              </div>

              <div class="form-group">
                <label for="notes" class="form-label">
                  What would you like from this session? <span class="form-label-hint">(optional)</span>
                </label>
                <textarea id="notes" formControlName="notes" class="form-control" rows="4" [attr.maxlength]="notesMax"
                          placeholder="You don't have to share anything here — it's entirely optional."
                          aria-describedby="notes-hint"></textarea>
                <span id="notes-hint" class="form-hint">{{ notesLength() }} / {{ notesMax }}</span>
              </div>

              <div class="form-group consent-group">
                <label class="consent-label" [class.invalid]="isInvalid('consent')">
                  <input type="checkbox" formControlName="consent" class="consent-checkbox"
                         [attr.aria-describedby]="isInvalid('consent') ? 'consent-error' : null"
                         [attr.aria-invalid]="isInvalid('consent')" />
                  <span>
                    I understand that Ksira Care offers private conversations
                    with a listening companion only — not therapy, counselling,
                    medical advice or crisis support.
                    <span class="required" aria-hidden="true">*</span>
                  </span>
                </label>
                @if (isInvalid('consent')) {
                  <span id="consent-error" class="form-error" role="alert">You must accept this to continue.</span>
                }
              </div>
            </fieldset>

            <!-- Step 3: Pay and confirm -->
            <fieldset class="form-section">
              <legend class="form-section__legend">
                <span class="form-section__number" aria-hidden="true">3</span>
                {{ paymentsEnabled ? 'Pay and confirm' : 'Confirm' }}
              </legend>

              <div class="payment-summary" role="group" aria-label="Payment summary">
                <div class="payment-summary__row">
                  <span>60-minute session</span>
                  <span class="payment-summary__price">{{ price }}</span>
                </div>
                <div class="payment-placeholder">
                  <span aria-hidden="true">💳</span>
                  <p>Secure payment by Razorpay</p>
                  <p class="payment-placeholder__sub">
                    {{ paymentsEnabled ? 'UPI, cards and netbanking' : 'Coming soon — no payment is taken for now.' }}
                  </p>
                </div>
              </div>

              @if (failure(); as failure) {
                <p class="notice" data-tone="error" role="alert">{{ failure }}</p>
              }

              <button type="submit" class="btn btn-primary submit-btn" [disabled]="submitting()" [attr.aria-busy]="submitting()">
                @if (submitting()) {
                  <span class="spinner" aria-hidden="true"></span>
                  Booking…
                } @else {
                  {{ paymentsEnabled ? 'Pay ' + price + ' and Book' : 'Confirm booking' }}
                }
              </button>

              <p class="payment-note">
                {{ paymentsEnabled ? "Payment is processed securely. You'll receive a confirmation email."
                                   : "We'll email you the video link before your session." }}
              </p>
            </fieldset>
          </form>
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
      color: var(--color-green-text);
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

    .book-languages { border: none; min-width: 0; }

    .book-zone {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .book-empty {
      padding: var(--space-lg);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      text-align: center;
    }

    .submit-btn {
      width: 100%;
      padding: 0.875rem;
      font-size: 1rem;
      gap: var(--space-sm);
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
      background-color: var(--color-green-tint);
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

    .success-state__home { margin-top: var(--space-lg); }

    .success-state__body {
      font-size: 1.0625rem;
      color: var(--color-text-muted);
    }
  `,
})
export class BookComponent {
  private readonly gateway = inject(BookingGateway);
  private readonly languagesGateway = inject(LanguagesGateway);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly price = PRICE;
  protected readonly paymentsEnabled = environment.paymentsEnabled;
  protected readonly lookaheadDays = LOOKAHEAD_DAYS;
  protected readonly nameMin = NAME_LENGTH.min;
  protected readonly nameMax = NAME_LENGTH.max;
  protected readonly notesMax = NOTES_MAX;

  protected readonly form = inject(NonNullableFormBuilder).group({
    languages: [[] as readonly string[], (control: { value: readonly string[] }) => (control.value.length ? null : { required: true })],
    name: ['', [Validators.required, Validators.minLength(NAME_LENGTH.min), Validators.maxLength(NAME_LENGTH.max)]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    notes: ['', Validators.maxLength(NOTES_MAX)],
    consent: [false, Validators.requiredTrue],
  });

  protected readonly languages = rxResource({ stream: () => this.languagesGateway.getLanguages() });
  protected readonly chosenLanguages = toSignal(this.form.controls.languages.valueChanges, {
    initialValue: [] as readonly string[],
  });
  private readonly notes = toSignal(this.form.controls.notes.valueChanges, { initialValue: '' });
  protected readonly notesLength = computed(() => this.notes().length);

  /** The free hours for the chosen languages, from now to the end of the booking window. */
  protected readonly hours = rxResource({
    params: () => {
      const languages = [...this.chosenLanguages()].sort();
      return languages.length ? { languages } : undefined;
    },
    stream: ({ params }) =>
      params ? this.gateway.getBookableHours(params.languages, new Date(Date.now() + LOOKAHEAD_DAYS * DAY_MS)) : of([]),
  });

  protected readonly start = signal<Date | null>(null);
  /** The chosen time on the visitor's own clock, when that isn't India time. */
  protected readonly localEquivalent = computed(() => {
    const start = this.start();
    return start && start.getTimezoneOffset() !== IST_OFFSET_MINUTES ? localWhen.format(start) : null;
  });
  protected readonly attempted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly confirmation = signal<BookingConfirmation | null>(null);
  protected readonly bookedEmail = signal('');

  protected isInvalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  protected when(date: Date): string {
    return `${longDay.format(date)} at ${clockTime.format(date)}`;
  }

  protected submit(): void {
    if (this.submitting()) return;
    this.attempted.set(true);
    this.form.markAllAsTouched();
    const start = this.start();
    if (this.form.invalid || !start) return;

    const { name, email, languages, notes } = this.form.getRawValue();
    this.submitting.set(true);
    this.failure.set(null);
    this.gateway
      .book({ name: name.trim(), email: email.trim().toLowerCase(), start, languages, notes: notes.trim() || null })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (booked) => {
          this.bookedEmail.set(email.trim());
          this.confirmation.set(booked);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error: unknown) => {
          const code = error instanceof ApiError ? error.code : 'UNKNOWN';
          this.failure.set(FAILURES[code] ?? 'Something went wrong. Please try again.');
          // The hour has gone: show what's free now.
          if (code === 'TIME_NOT_AVAILABLE' || code === 'INVALID_SLOT_TIME') {
            this.start.set(null);
            this.hours.reload();
          }
        },
      });
  }
}

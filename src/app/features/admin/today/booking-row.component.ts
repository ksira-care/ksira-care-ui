import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { formatLanguages } from '../../../core/format/languages';
import { formatTime, formatWeekdayDayMonth, portalDaysBetween } from '../../../core/time/portal-time';
import { CopyButtonComponent } from '../../../shared/ui/copy-button.component';
import { AaptaRef, Outcome, shortName } from '../admin.models';
import { AdminBooking } from './today.models';

interface OutcomeView {
  readonly label: string;
  readonly tone: string | null;
}

const OUTCOMES: Readonly<Record<Exclude<Outcome, 'pending'>, OutcomeView>> = {
  completed: { label: 'Completed', tone: 'success' },
  'client-no-show': { label: "Client didn't join", tone: 'danger' },
  'aapta-no-show': { label: 'Aapta no-show · refund', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: null },
};

/**
 * One booking on the Today page. Read-only until the admin presses Assign /
 * Update; then the aapta and BCC cells become inputs. The outcome is never
 * edited here: the aapta records it in their portal.
 */
@Component({
  selector: 'tr[appBookingRow]',
  standalone: true,
  imports: [CopyButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-state]': 'state()',
    '[attr.aria-busy]': 'busy()',
  },
  template: `
    <td class="row__time">
      <span class="row__start">{{ start() }}</span>
      <span class="row__end">– {{ end() }}</span>
    </td>

    <td>
      <span class="row__client">{{ booking().client.name }}</span>
      <span class="row__email">
        {{ booking().client.email }}
        <app-copy-button [text]="booking().client.email" [label]="'Copy ' + booking().client.name + '’s email'" />
      </span>
      @if (languages()) {
        <span class="row__languages">Speaks {{ languages() }}</span>
      }
      <button type="button" class="row__link" (click)="viewForm.emit()">View form</button>
    </td>

    <td>
      @if (editing()) {
        <label class="visually-hidden" [for]="selectId()">Aapta for {{ booking().client.name }}</label>
        <select class="form-control row__select" [id]="selectId()" [disabled]="busy() || options() === null"
                (change)="chosenAapta.set($any($event.target).value)">
          <option value="" [selected]="!chosenAapta()" disabled>
            {{ options() === null ? 'Loading…' : options()!.length ? 'Choose an aapta' : 'No one free who speaks their language' }}
          </option>
          @for (option of options() ?? []; track option.id) {
            <option [value]="option.id" [selected]="option.id === chosenAapta()">{{ fullName(option) }}</option>
          }
        </select>
      } @else if (booking().aapta; as aapta) {
        <span>{{ short(aapta) }}</span>
      } @else if (booking().outcome === 'pending') {
        <span class="badge" data-tone="warning">Needs an aapta</span>
      } @else {
        <span class="row__muted">—</span>
      }
      @if (booking().previousAapta; as previous) {
        <span class="row__muted row__was">Was {{ short(previous) }}</span>
      }
    </td>

    <td>
      @if (editing()) {
        <label class="row__check">
          <input type="checkbox" [checked]="chosenBcc()" [disabled]="busy() || !chosenAapta()"
                 (change)="chosenBcc.set($any($event.target).checked)" />
          Sent
        </label>
        @if (!chosenAapta()) {
          <span class="row__hint">Choose an aapta first</span>
        }
      } @else if (booking().aapta) {
        <span [class.row__muted]="!booking().bccEmailSent">{{ booking().bccEmailSent ? 'Sent' : 'Not sent' }}</span>
      } @else {
        <span class="row__muted">—</span>
      }
    </td>

    <td>
      @if (outcome(); as outcome) {
        <span class="badge" [attr.data-tone]="outcome.tone">{{ outcome.label }}</span>
        @if (booking().cancelReason) {
          <span class="row__muted row__reason">{{ booking().cancelReason }}</span>
        }
      } @else {
        <span class="row__muted">{{ waiting() }}</span>
      }
    </td>

    <td>
      <div class="row__actions">
      @if (editing()) {
        <button type="button" class="btn btn-primary btn-sm" [disabled]="busy() || !canSave()" (click)="submit()">
          {{ busy() ? 'Saving…' : 'Save' }}
        </button>
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="busy()" (click)="discard.emit()">Discard</button>
      } @else {
        @if (booking().editable) {
          <button type="button" [class]="booking().aapta ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm'"
                  [disabled]="locked()" (click)="edit.emit()">
            {{ booking().aapta ? 'Update' : 'Assign' }}
          </button>
        } @else if (opensLater()) {
          <span class="row__hint">You can assign from {{ opensLater() }}</span>
        }
        @if (booking().cancellable) {
          <button type="button" class="row__link row__link--danger" [disabled]="locked()" (click)="requestCancel.emit()">
            Cancel booking
          </button>
        }
      }
      @if (error(); as error) {
        <p class="row__error" role="alert">{{ error }}</p>
      }
      </div>
    </td>
  `,
  styles: `
    :host([data-state='needs-aapta']) { background-color: var(--color-crisis-bg); }
    :host([data-state='needs-aapta']) td:first-child { box-shadow: inset 4px 0 0 var(--color-crisis-border); }
    :host([data-state='editing']) { background-color: var(--color-info-bg); }
    :host([data-state='cancelled']) td { color: var(--color-text-muted); }

    td > span:not(.badge) { display: block; }

    .row__time { white-space: nowrap; }
    .row__start { font-weight: 700; font-variant-numeric: tabular-nums; }
    .row__end { font-size: 0.8125rem; color: var(--color-text-muted); }

    .row__client { font-weight: 600; }

    .row__email,
    .row__languages,
    .row__muted,
    .row__hint {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .row__email {
      display: flex !important;
      align-items: center;
      gap: 0.125rem;
      overflow-wrap: anywhere;
    }

    .row__was,
    .row__reason { margin-top: var(--space-xs); }

    .row__link {
      padding: 0;
      border: none;
      background: transparent;
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-green);
      cursor: pointer;

      &:hover:not(:disabled) { text-decoration: underline; }
      &:focus-visible { outline: 2px solid var(--color-green); outline-offset: 2px; border-radius: var(--radius-sm); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .row__link--danger { color: var(--color-danger); }

    .row__select {
      min-width: 12rem;
      padding-block: 0.4rem;
      font-size: 0.9375rem;
    }

    .row__check {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      cursor: pointer;

      input { width: 1rem; height: 1rem; accent-color: var(--color-green); }
    }

    .row__actions {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-sm);
      min-width: 9rem;
    }

    .row__error {
      max-width: 16rem;
      font-size: 0.8125rem;
      color: var(--color-danger);
    }
  `,
})
export class BookingRowComponent {
  readonly booking = input.required<AdminBooking>();
  readonly now = input.required<Date>();
  readonly editing = input(false);
  /** Who it can go to while editing; null while loading. */
  readonly options = input<readonly AaptaRef[] | null>(null);
  readonly busy = input(false);
  /** Another row is busy or being edited, so this one waits. */
  readonly locked = input(false);
  readonly error = input<string | null>(null);

  readonly edit = output<void>();
  readonly discard = output<void>();
  readonly save = output<{ aaptaId: string; bccEmailSent: boolean }>();
  readonly viewForm = output<void>();
  readonly requestCancel = output<void>();

  protected readonly chosenAapta = signal('');
  protected readonly chosenBcc = signal(false);

  protected readonly start = computed(() => formatTime(this.booking().start));
  protected readonly end = computed(() => formatTime(this.booking().end));
  protected readonly languages = computed(() => formatLanguages(this.booking().clientLanguages));
  protected readonly selectId = computed(() => `aapta-for-${this.booking().id}`);

  protected readonly state = computed(() => {
    if (this.editing()) return 'editing';
    const { outcome, aapta } = this.booking();
    if (outcome === 'cancelled') return 'cancelled';
    return !aapta && outcome === 'pending' ? 'needs-aapta' : null;
  });

  protected readonly outcome = computed(() => {
    const outcome = this.booking().outcome;
    return outcome === 'pending' ? null : OUTCOMES[outcome];
  });

  /** A pending session: still to happen, or waiting for the aapta to mark it. */
  protected readonly waiting = computed(() => {
    const { start, aapta } = this.booking();
    if (start > this.now()) return `After ${formatTime(start)}`;
    return aapta ? 'Awaiting aapta' : '—';
  });

  /** When a future booking becomes assignable (24 h before it starts). */
  protected readonly opensLater = computed(() => {
    const { editableFrom, start, outcome } = this.booking();
    if (outcome !== 'pending' || start <= this.now() || editableFrom <= this.now()) return null;
    const time = formatTime(editableFrom);
    return portalDaysBetween(this.now(), editableFrom) === 0 ? time : `${formatWeekdayDayMonth(editableFrom)}, ${time}`;
  });

  protected readonly canSave = computed(() => {
    const { aapta, bccEmailSent } = this.booking();
    const aaptaId = this.chosenAapta();
    return !!aaptaId && (aaptaId !== aapta?.id || this.chosenBcc() !== bccEmailSent);
  });

  constructor() {
    // Each time editing starts, begin from what is saved.
    effect(() => {
      if (!this.editing()) return;
      const { aapta, bccEmailSent } = this.booking();
      this.chosenAapta.set(aapta?.id ?? '');
      this.chosenBcc.set(bccEmailSent);
    });
  }

  protected short(aapta: AaptaRef): string {
    return shortName(aapta);
  }

  protected fullName(aapta: AaptaRef): string {
    return `${aapta.firstName} ${aapta.lastName}`;
  }

  protected submit(): void {
    if (this.canSave()) this.save.emit({ aaptaId: this.chosenAapta(), bccEmailSent: this.chosenBcc() });
  }
}

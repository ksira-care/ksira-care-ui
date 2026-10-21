import { ChangeDetectionStrategy, Component, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { formatDayLong, formatTime } from '../../../core/time/portal-time';
import { DialogComponent } from '../../../shared/ui/dialog.component';
import { AdminBooking } from './today.models';

const REASON_MAX = 500;

/**
 * Cancelling can't be undone, so it asks first, says what will happen, and
 * needs a reason. "Keep booking" comes first: the safe choice is the easy one.
 */
@Component({
  selector: 'app-cancel-booking-dialog',
  standalone: true,
  imports: [DialogComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog title="Cancel this booking?" [(open)]="open">
      <p class="cancel__what">
        <strong>{{ booking().client.name }}</strong> · {{ when() }}
        @if (booking().aapta; as aapta) { · with {{ aapta.firstName }} {{ aapta.lastName }} }
      </p>
      <p class="cancel__effect">
        The session is called off for good: there's no undo.
        @if (booking().aapta) { Their aapta's hour opens again for other bookings. }
        Let the client know yourself.
      </p>

      <form (ngSubmit)="submit()" novalidate>
        <div class="form-group">
          <label class="form-label" for="cancel-reason">Reason <span class="required" aria-hidden="true">*</span></label>
          <textarea
            id="cancel-reason"
            class="form-control"
            rows="3"
            name="reason"
            [maxlength]="reasonMax"
            [(ngModel)]="reason"
            [class.invalid]="showRequired()"
            [attr.aria-invalid]="showRequired()"
            aria-describedby="cancel-reason-hint"
            placeholder="e.g. The client asked to cancel by email."
          ></textarea>
          <p id="cancel-reason-hint" [class]="showRequired() ? 'form-error' : 'cancel__hint'">
            {{ showRequired() ? 'Add a reason. It goes in the booking’s history.' : 'Kept in the booking’s history.' }}
          </p>
        </div>

        @if (error()) {
          <p class="notice cancel__error" data-tone="error" role="alert">{{ error() }}</p>
        }

        <div class="cancel__actions">
          <button type="button" class="btn btn-outline" [disabled]="busy()" (click)="open.set(false)">Keep booking</button>
          <button type="submit" class="btn btn-danger" [disabled]="busy()">
            {{ busy() ? 'Cancelling…' : 'Cancel booking' }}
          </button>
        </div>
      </form>
    </app-dialog>
  `,
  styles: `
    .cancel__what { color: var(--color-text); }

    .cancel__effect {
      margin-block: var(--space-sm) var(--space-lg);
      font-size: 0.9375rem;
      color: var(--color-text-muted);
    }

    .cancel__hint { font-size: 0.8125rem; color: var(--color-text-muted); }
    .cancel__error { margin-top: var(--space-md); }

    .cancel__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
    }
  `,
})
export class CancelBookingDialogComponent {
  readonly booking = input.required<AdminBooking>();
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly open = model(true);
  readonly confirm = output<string>();

  protected readonly reasonMax = REASON_MAX;
  protected reason = '';
  private readonly attempted = signal(false);

  protected showRequired(): boolean {
    return this.attempted() && !this.reason.trim();
  }

  protected when(): string {
    return `${formatDayLong(this.booking().start)}, ${formatTime(this.booking().start)}`;
  }

  protected submit(): void {
    this.attempted.set(true);
    if (this.reason.trim()) this.confirm.emit(this.reason.trim());
  }
}

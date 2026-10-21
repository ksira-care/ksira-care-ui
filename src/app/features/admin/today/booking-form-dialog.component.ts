import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { formatLanguages } from '../../../core/format/languages';
import { formatDayLong, formatTime } from '../../../core/time/portal-time';
import { CopyButtonComponent } from '../../../shared/ui/copy-button.component';
import { DialogComponent } from '../../../shared/ui/dialog.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error.component';
import { TodayGateway } from './today.gateway';
import { AdminBooking } from './today.models';
import { LoadingRowsComponent } from '../../../shared/ui/loading-rows.component';

/** "View form": what the client entered when booking, field by field. */
@Component({
  selector: 'app-booking-form-dialog',
  standalone: true,
  imports: [LoadingRowsComponent, DialogComponent, CopyButtonComponent, LoadErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog title="Booking form" [(open)]="open">
      @if (form.hasValue()) {
        @let f = form.value();
        <dl class="form-fields">
          <div><dt>Name</dt><dd>{{ f.name }}</dd></div>
          <div>
            <dt>Email</dt>
            <dd class="form-fields__email">{{ f.email }} <app-copy-button [text]="f.email" label="Copy email" /></dd>
          </div>
          <div><dt>Languages</dt><dd>{{ languages(f.languages) || 'Not given' }}</dd></div>
          <div><dt>What they'd like from the session</dt><dd>{{ f.notes || 'Nothing written' }}</dd></div>
          <div><dt>Understood it isn't therapy</dt><dd>{{ f.consent ? 'Yes' : 'No' }}</dd></div>
          <div><dt>Booked</dt><dd>{{ when(f.submittedAt) }}</dd></div>
        </dl>
      } @else if (form.error()) {
        <app-load-error message="We couldn't load the form." (retry)="form.reload()" />
      } @else {
        <app-loading-rows label="Loading the form…" [rows]="5" />
      }
    </app-dialog>
  `,
  styles: `
    .form-fields { display: grid; gap: var(--space-md); }

    dt {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    dd { overflow-wrap: anywhere; color: var(--color-text); }

    .form-fields__email { display: flex; align-items: center; gap: var(--space-xs); }
  `,
})
export class BookingFormDialogComponent {
  /** The booking whose form to show; the dialog is open while set. */
  readonly booking = input.required<AdminBooking>();
  readonly open = model(true);

  private readonly gateway = inject(TodayGateway);
  protected readonly form = rxResource({
    params: () => this.booking().id,
    stream: ({ params: id }) => this.gateway.getForm(id),
  });

  protected languages(codes: readonly string[]): string {
    return formatLanguages(codes);
  }

  protected when(date: Date): string {
    return `${formatDayLong(date)}, ${formatTime(date)}`;
  }
}

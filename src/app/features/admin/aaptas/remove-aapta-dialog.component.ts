import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { fullName } from '../../../core/format/person-name';
import { DialogComponent } from '../../../shared/ui/dialog.component';
import { AaptaAccount } from './aaptas.models';

/** Removing an aapta ends their login at once, so it asks first and says exactly what happens. */
@Component({
  selector: 'app-remove-aapta-dialog',
  standalone: true,
  imports: [DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog [title]="'Remove ' + name() + '?'" [(open)]="open">
      <ul class="remove__effects">
        <li>Their login stops working straight away.</li>
        <li>Any upcoming sessions with them go back to needing an aapta on the Today page.</li>
        <li>Their past sessions stay in History.</li>
      </ul>
      @if (error()) {
        <p class="notice" data-tone="error" role="alert">{{ error() }}</p>
      }
      <div class="remove__actions">
        <button type="button" class="btn btn-outline" [disabled]="busy()" (click)="open.set(false)">Keep {{ aapta().firstName }}</button>
        <button type="button" class="btn btn-danger" [disabled]="busy()" (click)="confirm.emit()">
          {{ busy() ? 'Removing…' : 'Remove aapta' }}
        </button>
      </div>
    </app-dialog>
  `,
  styles: `
    .remove__effects {
      display: grid;
      gap: var(--space-xs);
      margin-bottom: var(--space-lg);
      padding-left: 1.25rem;
      list-style: disc;
      color: var(--color-text-body);
    }

    .remove__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-sm);
      margin-top: var(--space-md);
    }
  `,
})
export class RemoveAaptaDialogComponent {
  readonly aapta = input.required<AaptaAccount>();
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly open = model(true);
  readonly confirm = output<void>();

  protected readonly name = computed(() => fullName(this.aapta()));
}

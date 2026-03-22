import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  input,
  output,
  effect,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './modal.component.scss',
  template: `
    @if (isOpen()) {
      <div
        class="modal-backdrop"
        (click)="onBackdropClick()"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="title() ? 'modal-title' : undefined"
      >
        <div class="modal-content" (click)="$event.stopPropagation()">
          <header class="modal-header">
            @if (title()) {
              <h2 id="modal-title">{{ title() }}</h2>
            } @else {
              <!-- Fallback to custom content if no string title provided -->
              <ng-content select="[modal-title]"></ng-content>
            }
            <button
              class="modal-close-btn"
              (click)="close.emit()"
              aria-label="Close modal"
            >
              &times;
            </button>
          </header>

          <main class="modal-body">
            <!-- Main body content goes here -->
            <ng-content></ng-content>
          </main>

          <footer class="modal-footer">
            <!-- Optional footer buttons go here -->
            <ng-content select="[modal-footer]"></ng-content>
          </footer>
        </div>
      </div>
    }
  `
})
export class ModalComponent implements OnDestroy {
  /**
   * Strongly-typed inputs using Angular Signals (v17+) for maximum efficiency.
   * `isOpen` controls rendering; `title` is evaluated for the header region.
   */
  readonly title = input<string>();
  readonly isOpen = input(false);

  /**
   * Using modern `output()` function.
   * Emitted when user closes the modal (via backdrop click, escape key, or close button).
   */
  readonly close = output<void>();

  constructor() {
    effect(() => {
      // Toggle body scrolling based on modal state
      if (this.isOpen()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  ngOnDestroy() {
    // Ensure scroll is restored if component is destroyed while open
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onKeydownHandler(): void {
    if (this.isOpen()) {
      this.close.emit();
    }
  }

  onBackdropClick(): void {
    // Only dispatch the close event if clicked outside `.modal-content`
    this.close.emit();
  }
}

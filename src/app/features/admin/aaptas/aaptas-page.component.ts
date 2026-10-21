import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { formatLanguages } from '../../../core/format/languages';
import { fullName } from '../../../core/format/person-name';
import { formatPhone } from '../../../core/format/phone';
import { CopyButtonComponent } from '../../../shared/ui/copy-button.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error.component';
import { AddAaptaFormComponent } from './add-aapta-form.component';
import { AaptaAccount, AaptaAccountChanges, NewAapta } from './aaptas.models';
import { AaptasStore } from './aaptas.store';
import { EditAaptaDialogComponent } from './edit-aapta-dialog.component';
import { RemoveAaptaDialogComponent } from './remove-aapta-dialog.component';

/** A login just created, shown once so the admin can pass it on. */
interface CreatedLogin {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

/**
 * The roster: add an aapta (their login), change their login email or
 * languages, or remove them. Everything else about an aapta is theirs to
 * edit in their portal.
 */
@Component({
  selector: 'app-admin-aaptas-page',
  standalone: true,
  imports: [
    AddAaptaFormComponent,
    EditAaptaDialogComponent,
    RemoveAaptaDialogComponent,
    CopyButtonComponent,
    LoadErrorComponent,
  ],
  providers: [AaptasStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div>
        <h1 class="section-title page-header__title">Aaptas</h1>
        <p class="page-header__subtitle">{{ countLine() }}</p>
      </div>
      @if (!adding() && !created()) {
        <button type="button" class="btn btn-primary" (click)="startAdding()">+ Add an aapta</button>
      }
    </header>

    @if (adding()) {
      <section class="card aaptas__panel" aria-labelledby="add-aapta-heading">
        <h2 class="card__title aaptas__panel-title" id="add-aapta-heading">Add an aapta</h2>
        @if (store.languages.hasValue()) {
          <app-add-aapta-form
            [languages]="store.languages.value()"
            [busy]="store.busy()"
            [error]="store.error()"
            (create)="create($event)"
            (cancel)="adding.set(false)"
          />
        } @else if (store.languages.error()) {
          <app-load-error message="We couldn't load the list of languages." (retry)="store.languages.reload()" />
        } @else {
          <div class="skeleton aaptas__loading" aria-busy="true"><span class="visually-hidden">Loading…</span></div>
        }
      </section>
    }

    @if (created(); as login) {
      <section class="card aaptas__panel" aria-labelledby="created-heading" role="status">
        <h2 class="card__title aaptas__panel-title" id="created-heading">{{ login.name }} can sign in now</h2>
        <p class="aaptas__panel-text">Share these with them at <strong>ksiracare.com/login</strong>. The password won't be shown again.</p>
        <dl class="aaptas__login">
          <div><dt>Email</dt><dd>{{ login.email }} <app-copy-button [text]="login.email" label="Copy email" /></dd></div>
          <div><dt>Password</dt><dd><code>{{ login.password }}</code> <app-copy-button [text]="login.password" label="Copy password" /></dd></div>
        </dl>
        <button type="button" class="btn btn-primary" (click)="created.set(null)">Done</button>
      </section>
    }

    @if (store.roster.hasValue()) {
      @if (store.roster.value().length) {
        <div class="table-scroll">
          <table class="data-table">
            <caption class="visually-hidden">Aaptas on the roster</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Languages</th>
                <th scope="col"><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (aapta of store.roster.value(); track aapta.id) {
                <tr>
                  <td class="aaptas__name">{{ name(aapta) }}</td>
                  <td class="aaptas__email">{{ aapta.email }}</td>
                  <td class="aaptas__muted">{{ phone(aapta) }}</td>
                  <td>{{ languages(aapta) }}</td>
                  <td class="aaptas__actions">
                    <button type="button" class="icon-button" [attr.aria-label]="'Edit ' + name(aapta)" (click)="openEdit(aapta)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                      </svg>
                    </button>
                    <button type="button" class="icon-button" data-tone="danger" [attr.aria-label]="'Remove ' + name(aapta)" (click)="openRemove(aapta)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="aaptas__empty">No aaptas yet. Add the first one to give them a login.</p>
      }
    } @else if (store.roster.error()) {
      <app-load-error message="We couldn't load the roster." (retry)="store.roster.reload()" />
    } @else {
      <div class="skeleton aaptas__loading" aria-busy="true"><span class="visually-hidden">Loading the roster…</span></div>
    }

    @if (editing(); as aapta) {
      @if (store.languages.hasValue()) {
        <app-edit-aapta-dialog
          [aapta]="aapta"
          [languages]="store.languages.value()"
          [busy]="store.busy()"
          [error]="store.error()"
          (openChange)="$event || editing.set(null)"
          (save)="update(aapta, $event)"
        />
      }
    }
    @if (removing(); as aapta) {
      <app-remove-aapta-dialog
        [aapta]="aapta"
        [busy]="store.busy()"
        [error]="store.error()"
        (openChange)="$event || removing.set(null)"
        (confirm)="remove(aapta)"
      />
    }

    <div role="status" aria-live="polite">
      @if (store.notice(); as notice) {
        <p class="toast" data-tone="success">
          {{ notice }}
          <button type="button" class="icon-button aaptas__dismiss" aria-label="Dismiss" (click)="store.dismissNotice()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding-block: var(--space-2xl);
    }

    .aaptas__panel { margin-bottom: var(--space-lg); }
    .aaptas__panel-title { margin-bottom: var(--space-md); }
    .aaptas__panel-text { margin-bottom: var(--space-md); color: var(--color-text-muted); }

    .aaptas__login {
      display: grid;
      gap: var(--space-sm);
      margin-bottom: var(--space-lg);

      div { display: flex; align-items: center; gap: var(--space-md); }
      dt { min-width: 5rem; font-size: 0.875rem; color: var(--color-text-muted); }
      dd { display: flex; align-items: center; gap: var(--space-xs); color: var(--color-text); }
      code { font-size: 1rem; }
    }

    .aaptas__name { font-weight: 600; white-space: nowrap; }
    .aaptas__email { overflow-wrap: anywhere; }
    .aaptas__muted { color: var(--color-text-muted); white-space: nowrap; }
    .aaptas__actions { white-space: nowrap; text-align: right; }

    .aaptas__empty {
      padding: var(--space-xl);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-muted);
      text-align: center;
    }

    .aaptas__loading { height: 14rem; }
    .aaptas__dismiss { color: inherit; width: 1.5rem; height: 1.5rem; }
  `,
})
export class AaptasPageComponent {
  protected readonly store = inject(AaptasStore);

  protected readonly adding = signal(false);
  protected readonly created = signal<CreatedLogin | null>(null);
  protected readonly editing = signal<AaptaAccount | null>(null);
  protected readonly removing = signal<AaptaAccount | null>(null);

  protected readonly countLine = computed(() => {
    if (!this.store.roster.hasValue()) return 'Everyone who can sign in to the aapta portal';
    const count = this.store.roster.value().length;
    return count === 1 ? '1 on the roster' : `${count} on the roster`;
  });

  protected name(aapta: AaptaAccount): string {
    return fullName(aapta);
  }

  protected phone(aapta: AaptaAccount): string {
    return aapta.phone ? formatPhone(aapta.phone, { masked: false }) : '—';
  }

  protected languages(aapta: AaptaAccount): string {
    return formatLanguages(aapta.languages);
  }

  protected startAdding(): void {
    this.store.clearError();
    this.adding.set(true);
  }

  protected create(aapta: NewAapta): void {
    this.store.create(aapta, (account) => {
      this.adding.set(false);
      this.created.set({ name: fullName(account), email: account.email, password: aapta.password });
    });
  }

  protected openEdit(aapta: AaptaAccount): void {
    this.store.clearError();
    this.editing.set(aapta);
  }

  protected update(aapta: AaptaAccount, changes: AaptaAccountChanges): void {
    this.store.update(aapta, changes, () => this.editing.set(null));
  }

  protected openRemove(aapta: AaptaAccount): void {
    this.store.clearError();
    this.removing.set(aapta);
  }

  protected remove(aapta: AaptaAccount): void {
    this.store.remove(aapta, () => this.removing.set(null));
  }
}

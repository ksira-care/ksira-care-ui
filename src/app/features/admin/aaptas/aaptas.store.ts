import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize } from 'rxjs';
import { fullName } from '../../../core/format/person-name';
import { ApiError } from '../../../core/http/api-error';
import { LanguagesGateway } from '../../../core/languages/languages.gateway';
import { AaptasGateway } from './aaptas.gateway';
import { AaptaAccount, AaptaAccountChanges, NewAapta } from './aaptas.models';

const NOTICE_MS = 6000;

const FAILURES: Readonly<Record<string, string>> = {
  EMAIL_TAKEN: 'That email already has an account. Use a different one.',
  NOT_FOUND: 'That aapta has already been removed.',
  NETWORK: "We couldn't reach the server. Check your connection and try again.",
};

export function failureText(error: unknown): string {
  return FAILURES[error instanceof ApiError ? error.code : ''] ?? 'Something went wrong. Please try again.';
}

/** State for the Aaptas page: the roster, and adding, editing and removing aaptas. */
@Injectable()
export class AaptasStore {
  private readonly gateway = inject(AaptasGateway);
  private readonly languagesGateway = inject(LanguagesGateway);
  private readonly destroyRef = inject(DestroyRef);

  readonly roster = rxResource({ stream: () => this.gateway.getRoster() });
  readonly languages = rxResource({ stream: () => this.languagesGateway.getLanguages() });

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  private noticeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.noticeTimer));
  }

  create(aapta: NewAapta, done: (created: AaptaAccount) => void): void {
    this.run(this.gateway.create(aapta), (created) => {
      this.roster.update((list) => sortByName([...(list ?? []), created]));
      done(created);
    });
  }

  update(aapta: AaptaAccount, changes: AaptaAccountChanges, done: () => void): void {
    this.run(this.gateway.update(aapta.id, changes), (saved) => {
      this.roster.update((list) => list?.map((a) => (a.id === saved.id ? saved : a)));
      this.flash(changes.email
        ? `Saved. ${saved.firstName} now signs in with ${saved.email} and has been signed out everywhere.`
        : `Saved ${saved.firstName}'s languages.`);
      done();
    });
  }

  remove(aapta: AaptaAccount, done: () => void): void {
    this.run(this.gateway.remove(aapta.id), ({ unallocatedBookings }) => {
      this.roster.update((list) => list?.filter((a) => a.id !== aapta.id));
      const sessions = unallocatedBookings === 1 ? '1 upcoming session needs' : `${unallocatedBookings} upcoming sessions need`;
      this.flash(`Removed ${aapta.firstName} ${aapta.lastName}.${unallocatedBookings ? ` ${sessions} a new aapta on the Today page.` : ''}`);
      done();
    });
  }

  clearError(): void {
    this.error.set(null);
  }

  dismissNotice(): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(null);
  }

  private run<T>(request: Observable<T>, onDone: (result: T) => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    request
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: onDone, error: (error: unknown) => this.error.set(failureText(error)) });
  }

  private flash(text: string): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(text);
    this.noticeTimer = setTimeout(() => this.notice.set(null), NOTICE_MS);
  }
}

function sortByName(list: AaptaAccount[]): AaptaAccount[] {
  return list.sort((a, b) => fullName(a).localeCompare(fullName(b)));
}

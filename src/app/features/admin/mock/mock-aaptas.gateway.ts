import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiError } from '../../../core/http/api-error';
import { AaptasGateway } from '../aaptas/aaptas.gateway';
import { AaptaAccount, AaptaAccountChanges, NewAapta } from '../aaptas/aaptas.models';
import { respond } from './mock-latency';
import { MockAdminWorld } from './mock-admin-world';

/** Emails that already sign in elsewhere (the demo admin). */
const ADMIN_EMAILS = ['admin@ksiracare.com'];

@Injectable()
export class MockAaptasGateway extends AaptasGateway {
  private readonly world = inject(MockAdminWorld);

  override getRoster(): Observable<AaptaAccount[]> {
    return respond(() =>
      [...this.world.aaptas].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    );
  }

  override create(aapta: NewAapta): Observable<AaptaAccount> {
    return respond(() => {
      this.checkEmailFree(aapta.email);
      const { password: _password, ...details } = aapta;
      const account: AaptaAccount = {
        ...details,
        id: this.world.newId('ap'),
        email: aapta.email.toLowerCase(),
        phone: null,
        dateOfBirth: null,
        address: null,
      };
      this.world.aaptas.push(account);
      return account;
    });
  }

  override update(aaptaId: string, changes: AaptaAccountChanges): Observable<AaptaAccount> {
    return respond(() => {
      const index = this.indexOf(aaptaId);
      if (changes.email) this.checkEmailFree(changes.email, aaptaId);
      const updated = { ...this.world.aaptas[index], ...changes };
      this.world.aaptas[index] = updated;
      return updated;
    });
  }

  override remove(aaptaId: string): Observable<{ readonly unallocatedBookings: number }> {
    return respond(() => {
      const now = this.world.now();
      const upcoming = this.world.bookings.filter(
        (b) => b.aaptaId === aaptaId && b.outcome === 'pending' && b.start > now,
      );
      for (const booking of upcoming) {
        booking.previousAaptaId = aaptaId;
        booking.aaptaId = null;
        booking.version++;
      }
      this.world.aaptas.splice(this.indexOf(aaptaId), 1);
      return { unallocatedBookings: upcoming.length };
    });
  }

  private indexOf(aaptaId: string): number {
    const index = this.world.aaptas.findIndex((a) => a.id === aaptaId);
    if (index < 0) throw new ApiError('NOT_FOUND');
    return index;
  }

  private checkEmailFree(email: string, exceptId?: string): void {
    const taken =
      ADMIN_EMAILS.includes(email.toLowerCase()) ||
      this.world.aaptas.some((a) => a.id !== exceptId && a.email.toLowerCase() === email.toLowerCase());
    if (taken) throw new ApiError('EMAIL_TAKEN');
  }
}

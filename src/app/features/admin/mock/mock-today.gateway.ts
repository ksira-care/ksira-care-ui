import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiError } from '../../../core/http/api-error';
import { CivilDate } from '../../../core/time/civil-date';
import { HOUR_MS } from '../../../core/time/portal-time';
import { AaptaRef } from '../admin.models';
import { TodayGateway } from '../today/today.gateway';
import { AdminBooking, AllocationChange, BookingForm } from '../today/today.models';
import { respond } from './mock-latency';
import { MockAdminWorld, MockBooking, isOn } from './mock-admin-world';

/** The Today page against {@link MockAdminWorld}, with the backend's rules. */
@Injectable()
export class MockTodayGateway extends TodayGateway {
  private readonly world = inject(MockAdminWorld);

  override getDay(date: CivilDate): Observable<AdminBooking[]> {
    return respond(() =>
      this.world.bookings
        .filter((b) => isOn(b.start, date))
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map((b) => this.toRow(b)),
    );
  }

  override getForm(bookingId: string): Observable<BookingForm> {
    return respond(() => {
      const booking = this.world.booking(bookingId);
      return {
        name: booking.client.name,
        email: booking.client.email,
        languages: booking.languages,
        notes: booking.notes,
        consent: true,
        submittedAt: booking.submittedAt,
      };
    });
  }

  override getAaptaOptions(bookingId: string): Observable<AaptaRef[]> {
    return respond(() => {
      const booking = this.world.booking(bookingId);
      const current = this.world.ref(booking.aaptaId);
      const free = this.world.aaptas
        .filter((a) => this.world.hourState(a.id, booking.start) === 'open' && this.world.speaksAny(a.id, booking.languages))
        .map((a) => this.world.ref(a.id)!);
      return current ? [current, ...free] : free;
    });
  }

  override allocate(bookingId: string, change: AllocationChange): Observable<AdminBooking> {
    return respond(() => {
      const booking = this.current(bookingId, change.version);
      if (!this.world.isEditable(booking)) throw new ApiError('BOOKING_NOT_EDITABLE');
      if (change.aaptaId !== booking.aaptaId) {
        const open = this.world.hourState(change.aaptaId, booking.start) === 'open';
        if (!open || !this.world.speaksAny(change.aaptaId, booking.languages)) throw new ApiError('AAPTA_NOT_AVAILABLE');
        if (booking.aaptaId) this.world.setHour(booking.aaptaId, booking.start, 'open');
        this.world.setHour(change.aaptaId, booking.start, 'booked');
        booking.previousAaptaId = booking.aaptaId;
        booking.aaptaId = change.aaptaId;
        booking.outcome = 'pending';
      }
      booking.bccEmailSent = change.bccEmailSent;
      booking.version++;
      return this.toRow(booking);
    });
  }

  override cancel(bookingId: string, reason: string, version: number): Observable<AdminBooking> {
    return respond(() => {
      const booking = this.current(bookingId, version);
      if (booking.outcome !== 'pending') throw new ApiError('BOOKING_NOT_CANCELLABLE');
      if (booking.aaptaId) this.world.setHour(booking.aaptaId, booking.start, 'open');
      booking.outcome = 'cancelled';
      booking.cancelReason = reason;
      booking.version++;
      return this.toRow(booking);
    });
  }

  private current(bookingId: string, version: number): MockBooking {
    const booking = this.world.booking(bookingId);
    if (booking.version !== version) throw new ApiError('CONCURRENT_UPDATE');
    return booking;
  }

  private toRow(booking: MockBooking): AdminBooking {
    return {
      id: booking.id,
      start: booking.start,
      end: new Date(booking.start.getTime() + HOUR_MS),
      client: booking.client,
      clientLanguages: booking.languages,
      aapta: this.world.ref(booking.aaptaId),
      previousAapta: this.world.ref(booking.previousAaptaId),
      bccEmailSent: booking.bccEmailSent,
      outcome: booking.outcome,
      editable: this.world.isEditable(booking),
      editableFrom: this.world.editableFrom(booking),
      cancellable: booking.outcome === 'pending',
      cancelReason: booking.cancelReason,
      version: booking.version,
    };
  }
}

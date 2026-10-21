import { Injectable } from '@angular/core';
import { ApiError } from '../../../core/http/api-error';
import { CivilDate, addDays, portalToday, startOf } from '../../../core/time/civil-date';
import { DAY_MS, HOUR_MS, portalDay } from '../../../core/time/portal-time';
import { AaptaRef, Client, Outcome } from '../admin.models';
import { AaptaAccount } from '../aaptas/aaptas.models';
import { HourState } from '../availability/availability-overview.models';

/** First and last session start of the day (IST), as on the backend. */
export const FIRST_HOUR = 9;
export const LAST_HOUR = 23;
const ACTION_WINDOW_MS = DAY_MS;

export interface MockBooking {
  readonly id: string;
  readonly start: Date;
  readonly client: Client;
  readonly languages: readonly string[];
  readonly notes: string | null;
  readonly submittedAt: Date;
  aaptaId: string | null;
  previousAaptaId: string | null;
  bccEmailSent: boolean;
  outcome: Outcome;
  cancelReason: string | null;
  version: number;
}

const CLIENTS: readonly (Client & { languages: string[]; notes: string })[] = [
  { name: 'Ishita Bose', email: 'ishita.b@gmail.com', languages: ['hi'], notes: 'Trouble sleeping, racing thoughts.' },
  { name: 'Kabir Nair', email: 'kabir.n@outlook.com', languages: ['en'], notes: 'Long stretch of work pressure.' },
  { name: 'Farah Ali', email: 'farah.a@gmail.com', languages: ['en', 'hi'], notes: 'Wanted a calm hour after a rough week.' },
  { name: 'Rohan Patil', email: 'rohan.p@yahoo.in', languages: ['mr', 'hi'], notes: 'Feeling stuck after moving cities.' },
  { name: 'Priya Raman', email: 'priya.r@gmail.com', languages: ['kn', 'en'], notes: 'Anxiety before exams.' },
  { name: 'Tom Hughes', email: 'tom.h@gmail.com', languages: ['en'], notes: 'Just wants someone to listen.' },
];

/**
 * The admin console's world in development: aaptas, their hours and the
 * bookings, kept in memory and changed by the mock gateways with the same
 * rules as the backend (language matching, the 24-hour action window, hours
 * freed when a booking moves).
 */
@Injectable()
export class MockAdminWorld {
  readonly aaptas: AaptaAccount[] = [
    aapta('ap_aanya', 'Aanya', 'Mehta', ['en', 'hi', 'mr']),
    aapta('ap_meera', 'Meera', 'Joshi', ['en', 'hi']),
    aapta('ap_ravi', 'Ravi', 'Shah', ['en', 'kn']),
    aapta('ap_dev', 'Dev', 'Patel', ['en', 'hi']),
  ];
  readonly bookings: MockBooking[] = [];
  /** `aaptaId|startMs` → state; hours never opened are unavailable. */
  private readonly hours = new Map<string, HourState>();
  private nextId = 1;

  constructor() {
    this.seed(new Date());
  }

  now(): Date {
    return new Date();
  }

  ref(aaptaId: string | null): AaptaRef | null {
    const found = this.aaptas.find((a) => a.id === aaptaId);
    return found ? { id: found.id, firstName: found.firstName, lastName: found.lastName } : null;
  }

  hourState(aaptaId: string, start: Date): HourState {
    return this.hours.get(key(aaptaId, start)) ?? 'unavailable';
  }

  setHour(aaptaId: string, start: Date, state: HourState): void {
    this.hours.set(key(aaptaId, start), state);
  }

  /** Session starts of an IST day. */
  sessionStarts(date: CivilDate): Date[] {
    const midnight = startOf(date).getTime();
    return Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => new Date(midnight + (FIRST_HOUR + i) * HOUR_MS));
  }

  booking(id: string): MockBooking {
    const found = this.bookings.find((b) => b.id === id);
    if (!found) throw new ApiError('NOT_FOUND');
    return found;
  }

  isEditable(booking: MockBooking): boolean {
    const now = this.now().getTime();
    const start = booking.start.getTime();
    return booking.outcome !== 'cancelled' && now >= start - ACTION_WINDOW_MS && now < start;
  }

  editableFrom(booking: MockBooking): Date {
    return new Date(booking.start.getTime() - ACTION_WINDOW_MS);
  }

  speaksAny(aaptaId: string, languages: readonly string[]): boolean {
    const spoken = this.aaptas.find((a) => a.id === aaptaId)?.languages ?? [];
    return languages.length === 0 || languages.some((l) => spoken.includes(l));
  }

  newId(prefix: string): string {
    return `${prefix}_${this.nextId++}`;
  }

  private seed(now: Date): void {
    const today = portalToday(now);
    // Hours: each aapta opens a pattern on every day from six weeks back to two weeks ahead.
    for (let offset = -45; offset <= 14; offset++) {
      const date = addDays(today, offset);
      this.aaptas.forEach((aapta, a) => {
        this.sessionStarts(date).forEach((start, h) => {
          if ((h + a * 2 + offset) % 3 !== 0 && !(a === 0 && offset === 1)) this.setHour(aapta.id, start, 'open');
        });
      });
    }
    // Past sessions, with outcomes.
    for (let offset = -45; offset < 0; offset++) {
      const date = addDays(today, offset);
      [11, 17].slice(0, offset % 3 === 0 ? 1 : 2).forEach((hour, i) => {
        const outcome: Outcome = offset % 7 === 0 && i === 0 ? 'client-no-show'
          : offset % 11 === 0 ? 'aapta-no-show'
          : offset % 13 === 0 && i === 1 ? 'cancelled' : 'completed';
        this.add(date, hour, mod(offset * 2 + i, CLIENTS.length), this.aaptas[mod(offset + i, this.aaptas.length)].id, outcome);
      });
    }
    // Today and tomorrow: some still need an aapta.
    const hourNow = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(now));
    const later = (h: number) => Math.min(Math.max(h, hourNow + 1), LAST_HOUR);
    if (hourNow - 2 >= FIRST_HOUR) this.add(today, hourNow - 2, 0, 'ap_meera', 'completed');
    this.add(today, later(hourNow + 1), 1, 'ap_ravi', 'pending', true);
    this.add(today, later(hourNow + 2), 2, null, 'pending');
    this.add(today, later(hourNow + 4), 3, 'ap_dev', 'pending', false, 'ap_aanya');
    this.add(addDays(today, 1), 10, 4, null, 'pending');
    this.add(addDays(today, 1), 12, 5, 'ap_aanya', 'pending', true);
    this.add(addDays(today, 1), 16, 3, null, 'pending');
    const cancelled = this.add(addDays(today, 1), 18, 0, null, 'cancelled');
    cancelled.cancelReason = 'Client asked to cancel by email.';
  }

  private add(date: CivilDate, hour: number, clientIndex: number, aaptaId: string | null, outcome: Outcome,
              bccEmailSent = outcome !== 'pending', previousAaptaId: string | null = null): MockBooking {
    const client = CLIENTS[clientIndex];
    const start = new Date(startOf(date).getTime() + hour * HOUR_MS);
    const booking: MockBooking = {
      id: this.newId('bk'),
      start,
      client: { name: client.name, email: client.email },
      languages: client.languages,
      notes: client.notes,
      submittedAt: new Date(start.getTime() - 3 * DAY_MS),
      aaptaId: outcome === 'cancelled' ? null : aaptaId,
      previousAaptaId,
      bccEmailSent: aaptaId !== null && bccEmailSent,
      outcome,
      cancelReason: null,
      version: 0,
    };
    if (booking.aaptaId) this.setHour(booking.aaptaId, start, 'booked');
    this.bookings.push(booking);
    return booking;
  }
}

function aapta(id: string, firstName: string, lastName: string, languages: string[]): AaptaAccount {
  return {
    id,
    email: `${firstName.toLowerCase()}@ksiracare.com`,
    firstName,
    middleName: null,
    lastName,
    phone: '+919876543210',
    dateOfBirth: '1990-05-01',
    languages,
    address: 'Pune, Maharashtra',
  };
}

/** Modulo that stays positive for negative numbers (JavaScript's % keeps the sign). */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function key(aaptaId: string, start: Date): string {
  return `${aaptaId}|${start.getTime()}`;
}

/** Whether `date` (a Date) falls on the IST day `day`. */
export function isOn(date: Date, day: CivilDate): boolean {
  return portalDay(date) === day;
}

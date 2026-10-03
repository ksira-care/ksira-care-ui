import { DAY_MS, portalDay, portalDayRange, portalMonthRange } from '../portal-time';
import { Booking, BookingStatus } from './booking.models';

/**
 * Deterministic demo data for last, this and next IST month, shared by the
 * bookings and dashboard mocks so every number on screen agrees.
 */

const SESSION_MINUTES = 60;

const CLIENTS = [
  { name: 'Sara Lopez', reason: 'To be heard about work stress.', languages: ['en'] },
  { name: 'Michael Turner', reason: 'A calm space, feeling isolated abroad.', languages: ['en'] },
  { name: 'Lena Krüger', reason: 'Venting after a breakup.', languages: ['de', 'en'] },
  { name: 'Omar Farouk', reason: 'Anxious thoughts, wanted to slow down.', languages: ['ar', 'en'] },
  { name: 'Priya Raman', reason: 'Grief — just needed someone to listen.', languages: ['ta', 'en'] },
  { name: 'Daniel Wright', reason: 'Wanted to talk through a career decision.', languages: ['en'] },
  { name: 'Ishita Bose', reason: 'Trouble sleeping, racing thoughts.', languages: ['hi', 'bn'] },
  { name: 'Rohan Kulkarni', reason: 'Feeling stuck after moving cities.', languages: ['mr', 'hi', 'en'] },
] as const;

/** Session start times (IST) used across the month. */
const SLOTS = ['09:00', '11:30', '16:00', '18:30', '20:00'];

/** How many sessions each weekday-ish position gets; a gentle, varied rhythm. */
const SESSIONS_PER_DAY = [2, 1, 0, 2, 1, 3, 0];

/**
 * Today is deliberately a busy day (10 sessions, 08:00–19:15) so the
 * dashboard's folding and "+ N more" behaviour can be seen and demoed.
 */
const TODAY_SLOTS = [
  '08:00', '09:15', '10:30', '11:45', '13:00',
  '14:15', '15:30', '16:45', '18:00', '19:15',
];

const ASSIGNED_DAYS_BEFORE = 3;
const MARKED_AFTER_MINUTES = 10;

function statusFor(end: Date, now: Date, index: number): BookingStatus {
  if (end > now) return 'scheduled';
  // A few recent sessions the therapist hasn't marked yet.
  if (now.getTime() - end.getTime() < 1.5 * DAY_MS && index % 3 === 0) return 'scheduled';
  if (index % 5 === 2) return 'client-no-show';
  if (index % 23 === 9) return 'therapist-no-show';
  return 'completed';
}

/**
 * Covers last month (for the 30-day Completed view) through next month (so
 * "next session" works on the last day of a month).
 */
export function mockBookings(now: Date): Booking[] {
  const thisMonth = portalMonthRange(now);
  const start = portalMonthRange(new Date(thisMonth.start.getTime() - 1)).start;
  const end = portalMonthRange(thisMonth.end).end;
  const rescheduledDay = portalDay(new Date(now.getTime() + DAY_MS));
  const today = portalDay(now);
  const bookings: Booking[] = [];

  for (let day = start, d = 0; day < end; day = portalDayRange(day).end, d++) {
    const date = portalDay(day);
    const slots = date === today ? TODAY_SLOTS : SLOTS.slice(0, SESSIONS_PER_DAY[d % 7]);

    for (const time of slots) {
      const index = bookings.length;
      const client = CLIENTS[(d * 3 + index) % CLIENTS.length];
      const start = new Date(`${date}T${time}:00+05:30`);
      const end = new Date(start.getTime() + SESSION_MINUTES * 60_000);

      // Tomorrow's first session was moved by an admin from the day before.
      const rescheduled = date === rescheduledDay && time === slots[0];

      const status = statusFor(end, now, index);
      bookings.push({
        id: `bk_${date}_${time.replace(':', '')}`,
        start,
        end,
        clientName: client.name,
        reason: client.reason,
        status,
        clientLanguages: client.languages,
        assignedAt: new Date(start.getTime() - ASSIGNED_DAYS_BEFORE * DAY_MS),
        rescheduledFrom: rescheduled ? new Date(start.getTime() - DAY_MS) : null,
        rescheduleNote: rescheduled
          ? 'Client requested the change by email more than 24 h ahead.'
          : null,
        // Therapists mark sessions shortly after they end; admin records therapist no-shows.
        markedAt:
          status === 'completed' || status === 'client-no-show'
            ? new Date(end.getTime() + MARKED_AFTER_MINUTES * 60_000)
            : null,
      });
    }
  }
  return bookings;
}

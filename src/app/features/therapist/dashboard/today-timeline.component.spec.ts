import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Booking } from '../bookings/booking.models';
import { NextSessionCardComponent } from './next-session-card.component';
import { TodayTimelineComponent } from './today-timeline.component';

const ist = (isoLocal: string) => new Date(`${isoLocal}+05:30`);

function booking(name: string, start: string, status: Booking['status'] = 'scheduled'): Booking {
  const startDate = ist(start);
  return {
    id: start,
    start: startDate,
    end: new Date(startDate.getTime() + 60 * 60_000),
    clientName: name,
    reason: 'Work stress',
    status,
    clientLanguages: ['hi', 'en'],
    assignedAt: null,
    rescheduledFrom: null,
    rescheduleNote: null,
    markedAt: null,
  };
}

async function renderTimeline(bookings: Booking[], now: string) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(TodayTimelineComponent);
  fixture.componentRef.setInput('bookings', bookings);
  fixture.componentRef.setInput('now', ist(now));
  await fixture.whenStable();
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

describe('TodayTimelineComponent', () => {
  const day = [
    booking('Michael Turner', '2026-10-03T10:00', 'completed'),
    booking('Daniel Wright', '2026-10-03T12:00', 'client-no-show'),
    booking('Lena Kruger', '2026-10-03T14:30'),
    booking('Omar Farouk', '2026-10-03T17:30'),
  ];

  const rows = (host: HTMLElement) =>
    [...host.querySelectorAll('.today__item:not(.today__item--summary)')].map(
      (li) => `${li.getAttribute('data-state')} ${li.querySelector('.today__time')?.textContent}`,
    );

  it('marks finished, current and upcoming sessions', async () => {
    const { host } = await renderTimeline([day[0], day[2], day[3]], '2026-10-03T15:00');

    expect(rows(host)).toEqual(['done 10:00', 'now 14:30', 'upcoming 17:30']);
    expect(host.textContent).toContain('Now');
    expect(host.textContent).toContain('2 still to come');
  });

  it('collapses several finished sessions into one line that can be expanded', async () => {
    const { fixture, host } = await renderTimeline(day, '2026-10-03T15:00');
    const toggle = host.querySelector<HTMLButtonElement>('.today__toggle')!;

    expect(host.textContent).toContain('2 done earlier');
    expect(rows(host)).toEqual(['now 14:30', 'upcoming 17:30']);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    await fixture.whenStable();

    expect(rows(host)).toEqual(['done 10:00', 'done 12:00', 'now 14:30', 'upcoming 17:30']);
    expect(host.textContent).toContain("Client didn't join");
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('lists the current session and the next four, linking to the rest', async () => {
    const busy = ['09', '10', '11', '12', '13', '14', '15', '16', '17'].map((h) =>
      booking(`Client ${h} Person`, `2026-10-03T${h}:00`),
    );
    const { host } = await renderTimeline(busy, '2026-10-03T09:30');

    expect(rows(host)).toEqual([
      'now 09:00',
      'upcoming 10:00',
      'upcoming 11:00',
      'upcoming 12:00',
      'upcoming 13:00',
    ]);
    expect(host.textContent).toContain('+ 4 more later today');
    expect(host.querySelector('.today__more-link')?.getAttribute('href')).toBe('/therapist/bookings');
    expect(host.textContent).toContain('9 still to come');
  });

  it('closes the day on a positive note', async () => {
    const { host } = await renderTimeline(day.slice(0, 2), '2026-10-03T21:00');

    expect(host.textContent).toContain('2 done');
    expect(host.textContent).toContain("You're done for today");
    expect(host.textContent).toContain('1 session completed');
  });

  it('says when there are no sessions at all', async () => {
    const { host } = await renderTimeline([], '2026-10-03T09:00');

    expect(host.textContent).toContain('No sessions today.');
  });
});

describe('NextSessionCardComponent', () => {
  async function renderCard(booking: Booking | null, now: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(NextSessionCardComponent);
    fixture.componentRef.setInput('booking', booking);
    fixture.componentRef.setInput('now', ist(now));
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('shows who, when, why and in which languages', async () => {
    const host = await renderCard(booking('Omar Farouk', '2026-10-03T17:30'), '2026-10-03T16:45');

    expect(host.textContent).toContain('Next session');
    expect(host.textContent).toContain('In 45 min');
    expect(host.textContent).toContain('17:30 – 18:30');
    expect(host.textContent).toContain('Omar F.');
    expect(host.textContent).toContain('“Work stress”');
    expect(host.textContent).toContain('Hindi, English');
  });

  it('switches to "In session" while it is happening', async () => {
    const host = await renderCard(booking('Omar Farouk', '2026-10-03T17:30'), '2026-10-03T17:45');

    expect(host.textContent).toContain('In session');
    expect(host.textContent).toContain('Happening now');
    expect(host.classList).toContain('next-session--live');
  });

  it('says when nothing is coming up', async () => {
    const host = await renderCard(null, '2026-10-03T16:45');

    expect(host.textContent).toContain('Nothing booked in the next two weeks.');
  });
});

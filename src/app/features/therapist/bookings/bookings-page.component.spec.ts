import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Booking, TherapistSetStatus } from './booking.models';
import { BookingsPageComponent } from './bookings-page.component';
import { BookingsGateway } from './bookings.gateway';

const ist = (isoLocal: string) => new Date(`${isoLocal}+05:30`);
const NOW = ist('2026-10-03T15:00');

function booking(name: string, start: string, overrides: Partial<Booking> = {}): Booking {
  const startDate = ist(start);
  return {
    id: start,
    start: startDate,
    end: new Date(startDate.getTime() + 60 * 60_000),
    clientName: name,
    reason: `${name}'s reason`,
    status: 'scheduled',
    clientLanguages: ['en'],
    assignedAt: null,
    rescheduledFrom: null,
    rescheduleNote: null,
    markedAt: null,
    ...overrides,
  };
}

const BOOKINGS = [
  booking('Priya Raman', '2026-10-02T09:00'), // yesterday, never marked
  booking('Sara Lopez', '2026-10-01T09:00', { status: 'completed', markedAt: ist('2026-10-01T10:15') }),
  booking('Lena Kruger', '2026-10-03T10:00', { status: 'client-no-show', markedAt: ist('2026-10-03T11:10') }),
  booking('Rohan Kulkarni', '2026-09-28T09:00', { status: 'completed' }), // last month
  booking('Daniel Wright', '2026-10-03T14:30'), // in progress
  booking('Omar Farouk', '2026-10-03T17:30', {
    assignedAt: ist('2026-09-30T11:00'),
    rescheduledFrom: ist('2026-10-02T16:00'),
    rescheduleNote: 'Client requested the change by email more than 24 h ahead.',
  }),
];

describe('BookingsPageComponent', () => {
  let fixture: ComponentFixture<BookingsPageComponent>;
  let host: HTMLElement;
  let getBookings: ReturnType<typeof vi.fn<() => Observable<Booking[]>>>;
  let updateStatus: ReturnType<typeof vi.fn<(id: string, status: TherapistSetStatus) => Observable<void>>>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    host?.remove();
  });

  async function render(response: Observable<Booking[]> = of(BOOKINGS), { settle = true } = {}) {
    getBookings = vi.fn(() => response);
    updateStatus = vi.fn(() => of(undefined));
    await TestBed.configureTestingModule({
      imports: [BookingsPageComponent],
      providers: [{ provide: BookingsGateway, useValue: { getBookings, updateStatus } }],
    }).compileComponents();
    fixture = TestBed.createComponent(BookingsPageComponent);
    host = fixture.nativeElement;
    document.body.appendChild(host);
    if (settle) await fixture.whenStable();
    else fixture.detectChanges();
  }

  const tabs = () => [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const cards = () => [...host.querySelectorAll<HTMLElement>('app-booking-card')];
  const card = (client: string) => cards().find((c) => c.textContent?.includes(client))!;
  const cardSummary = () =>
    cards().map(
      (c) => `${c.querySelector('.booking__meta')?.textContent?.split(' · ')[0]}:${c.dataset['status']}`,
    );

  async function click(element: Element | null | undefined): Promise<void> {
    (element as HTMLElement).click();
    await fixture.whenStable();
  }

  it('loads the last 30 days through the end of today', async () => {
    await render();

    expect(getBookings).toHaveBeenCalledWith({
      start: ist('2026-09-03T00:00'),
      end: ist('2026-10-04T00:00'),
    });
  });

  it('lists everything still to mark, forgotten sessions first', async () => {
    await render();

    expect(tabs().map((t) => t.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Today · 3',
      'Completed',
    ]);
    expect(cardSummary()).toEqual([
      'Priya R.:needs-marking',
      'Daniel W.:in-progress',
      'Omar F.:scheduled',
    ]);
    expect(host.textContent).toContain('1 past session needs marking.');
  });

  it('only offers marking once a session has started', async () => {
    await render();

    expect(card('Daniel W.').querySelector('.booking__complete')).not.toBeNull();
    expect(card('Omar F.').querySelector('.booking__complete')).toBeNull();
    expect(card('Omar F.').textContent).toContain('You can mark this from 17:30.');
  });

  it('shows who assigned it and why it was rescheduled', async () => {
    await render();
    const omar = card('Omar F.');

    expect(omar.textContent).toContain('assigned by admin on 30 Sept');
    expect(omar.textContent).toContain('Rescheduled by admin');
    expect(omar.textContent).toContain('Moved from Fri 2 Oct, 16:00. Client requested the change');
  });

  it('marks a session complete, moves it to Completed and offers Undo', async () => {
    await render();
    await click(card('Daniel W.').querySelector('.booking__complete'));

    expect(updateStatus).toHaveBeenCalledWith('2026-10-03T14:30', 'completed');
    expect(cardSummary()).not.toContain('Daniel W.:in-progress');
    expect(host.querySelector('.toast')?.textContent).toContain('Marked complete — Daniel W.');

    await click(host.querySelector('.toast__undo'));

    expect(updateStatus).toHaveBeenLastCalledWith('2026-10-03T14:30', 'scheduled');
    expect(cardSummary()).toContain('Daniel W.:in-progress');
  });

  it('records a client who did not join', async () => {
    await render();
    await click(card('Priya R.').querySelector('.booking__no-show'));

    expect(updateStatus).toHaveBeenCalledWith('2026-10-02T09:00', 'client-no-show');
    await click(tabs()[1]);
    expect(card('Priya R.').querySelector('.badge')?.textContent).toBe("Client didn't join");
  });

  it('keeps the session and explains when marking fails', async () => {
    await render();
    updateStatus.mockReturnValue(throwError(() => new Error('boom')));
    await click(card('Daniel W.').querySelector('.booking__complete'));

    expect(card('Daniel W.').querySelector('[role="alert"]')?.textContent).toContain(
      "Couldn't update",
    );
  });

  it("lists this month's marked sessions newest first under Completed", async () => {
    await render();
    await click(tabs()[1]);

    expect(cardSummary()).toEqual(['Lena K.:client-no-show', 'Sara L.:completed']);
    expect(host.querySelector('.booking__complete')).toBeNull();
  });

  it('lets a mark made today be undone until midnight, but not older ones', async () => {
    await render();
    await click(tabs()[1]);

    expect(card('Lena K.').textContent).toContain('You can undo this until midnight.');
    expect(card('Sara L.').querySelector('.booking__undo')).toBeNull();

    await click(card('Lena K.').querySelector('.booking__undo'));

    expect(updateStatus).toHaveBeenCalledWith('2026-10-03T10:00', 'scheduled');
    await click(tabs()[0]);
    expect(cardSummary()).toContain('Lena K.:needs-marking');
  });

  it('explains an empty Today tab', async () => {
    await render(of(BOOKINGS.filter((b) => b.status !== 'scheduled')));

    expect(host.textContent).toContain('Nothing left to mark today.');
  });

  it('explains an empty Completed tab', async () => {
    await render(of(BOOKINGS.filter((b) => b.status === 'scheduled')));
    await click(tabs()[1]);

    expect(host.textContent).toContain('No completed sessions this month yet.');
  });

  it('shows a loading state while bookings load', async () => {
    await render(new Subject<Booking[]>(), { settle: false });

    expect(host.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('offers a retry when loading fails', async () => {
    await render(throwError(() => new Error('boom')));
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      "couldn't load your bookings",
    );

    getBookings.mockReturnValue(of(BOOKINGS));
    await click(host.querySelector('[role="alert"] button'));

    expect(cards()).toHaveLength(3);
  });
});

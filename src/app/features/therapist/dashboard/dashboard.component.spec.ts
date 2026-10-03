import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthenticatedUser } from '../../../core/auth/auth.models';
import { Booking } from '../bookings/booking.models';
import { BookingsGateway } from '../bookings/bookings.gateway';
import { DashboardComponent } from './dashboard.component';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardSummary } from './dashboard.models';

const ist = (isoLocal: string) => new Date(`${isoLocal}+05:30`);
const NOW = ist('2026-10-03T15:00');

const SUMMARY: DashboardSummary = {
  completedThisMonth: 14,
  completedAllTime: 1280,
  activeSince: new Date('2025-01-15'),
};

function booking(name: string, start: string, status: Booking['status'] = 'scheduled'): Booking {
  const startDate = ist(start);
  return {
    id: start,
    start: startDate,
    end: new Date(startDate.getTime() + 60 * 60_000),
    clientName: name,
    reason: `${name}'s reason`,
    status,
    clientLanguages: ['en'],
    assignedAt: null,
    rescheduledFrom: null,
    rescheduleNote: null,
    markedAt: null,
  };
}

const BOOKINGS = [
  booking('Lena Kruger', '2026-10-03T10:00', 'completed'),
  booking('Omar Farouk', '2026-10-03T17:30'),
  booking('Sara Lopez', '2026-10-04T09:00'),
];

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let host: HTMLElement;
  let getSummary: ReturnType<typeof vi.fn<() => Observable<DashboardSummary>>>;
  let getBookings: ReturnType<typeof vi.fn<() => Observable<Booking[]>>>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => vi.useRealTimers());

  async function render(
    summary: Observable<DashboardSummary> = of(SUMMARY),
    bookings: Observable<Booking[]> = of(BOOKINGS),
    { settle = true } = {},
  ): Promise<void> {
    getSummary = vi.fn(() => summary);
    getBookings = vi.fn(() => bookings);
    const user = signal<AuthenticatedUser>({ id: 'th_1', name: 'Aanya Mehta', email: 'a@k.com' });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user } },
        { provide: DashboardGateway, useValue: { getSummary } },
        { provide: BookingsGateway, useValue: { getBookings } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    host = fixture.nativeElement;
    if (settle) await fixture.whenStable();
    else fixture.detectChanges();
  }

  it('greets the therapist by first name and notes the timezone', async () => {
    await render();

    expect(host.querySelector('h1')?.textContent).toBe('Good afternoon, Aanya.');
    expect(host.textContent).toContain('all times IST');
  });

  it('shows the next session with a countdown', async () => {
    await render();
    const card = host.querySelector('app-next-session-card')!;

    expect(card.textContent).toContain('In 2 h 30 min');
    expect(card.textContent).toContain('Omar F.');
    expect(card.textContent).toContain("Omar Farouk's reason");
  });

  it("lists only today's sessions in the timeline", async () => {
    await render();
    const timeline = host.querySelector('app-today-timeline')!;

    expect(timeline.textContent).toContain('Lena K.');
    expect(timeline.textContent).toContain('Omar F.');
    expect(timeline.textContent).not.toContain('Sara L.');
    expect(timeline.textContent).toContain('1 still to come');
  });

  it('asks for today plus the next two weeks of bookings', async () => {
    await render();

    expect(getBookings).toHaveBeenCalledWith({
      start: ist('2026-10-03T00:00'),
      end: ist('2026-10-17T00:00'),
    });
  });

  it('shows the two totals and links to all bookings', async () => {
    await render();
    const values = [...host.querySelectorAll('.stat-card__value')].map((el) => el.textContent);

    expect(values).toEqual(['14', '1,280']);
    expect(host.textContent).toContain('Since Jan 2025');
    expect(host.querySelector('a.dashboard__all-bookings')?.getAttribute('href')).toBe('/therapist/bookings');
  });

  it('falls back to a neutral caption when the start date is unknown', async () => {
    await render(of({ ...SUMMARY, activeSince: null }));

    expect(host.textContent).toContain('Across all your sessions');
  });

  it('shows loading states until data arrives', async () => {
    await render(new Subject<DashboardSummary>(), new Subject<Booking[]>(), { settle: false });

    expect(host.querySelectorAll('[aria-busy="true"]')).toHaveLength(2);
    expect(host.querySelector('app-next-session-card')).toBeNull();
  });

  it('offers a retry when sessions fail to load', async () => {
    await render(of(SUMMARY), throwError(() => new Error('boom')));
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("couldn't load your sessions");

    getBookings.mockReturnValue(of(BOOKINGS));
    host.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    await fixture.whenStable();

    expect(host.querySelector('app-next-session-card')).not.toBeNull();
  });
});

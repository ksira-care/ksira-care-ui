import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { ApiError } from '../../../core/http/api-error';
import { AaptaRef } from '../admin.models';
import { TodayPageComponent } from './today-page.component';
import { TodayGateway } from './today.gateway';
import { AdminBooking, AllocationChange, BookingForm } from './today.models';

const ist = (isoLocal: string) => new Date(`${isoLocal}+05:30`);
const NOW = ist('2026-10-21T14:00');
const ANYA: AaptaRef = { id: 'ap_1', firstName: 'Aanya', lastName: 'Mehta' };
const DEV: AaptaRef = { id: 'ap_2', firstName: 'Dev', lastName: 'Patel' };

function booking(id: string, start: string, overrides: Partial<AdminBooking> = {}): AdminBooking {
  const startDate = ist(start);
  return {
    id,
    start: startDate,
    end: new Date(startDate.getTime() + 3_600_000),
    client: { name: `Client ${id}`, email: `${id}@example.com` },
    clientLanguages: ['hi', 'en'],
    aapta: null,
    previousAapta: null,
    bccEmailSent: false,
    outcome: 'pending',
    editable: true,
    editableFrom: new Date(startDate.getTime() - 86_400_000),
    cancellable: true,
    cancelReason: null,
    version: 3,
    ...overrides,
  };
}

const ROWS = [
  booking('done', '2026-10-21T11:00', { aapta: ANYA, outcome: 'completed', bccEmailSent: true, editable: false, cancellable: false }),
  booking('open', '2026-10-21T16:00'),
  booking('held', '2026-10-21T19:00', { aapta: DEV, previousAapta: ANYA }),
  booking('later', '2026-10-24T10:00', { editable: false }),
];

describe('TodayPageComponent', () => {
  let fixture: ComponentFixture<TodayPageComponent>;
  let host: HTMLElement;
  let gateway: {
    getDay: ReturnType<typeof vi.fn<() => Observable<AdminBooking[]>>>;
    getForm: ReturnType<typeof vi.fn<() => Observable<BookingForm>>>;
    getAaptaOptions: ReturnType<typeof vi.fn<() => Observable<AaptaRef[]>>>;
    allocate: ReturnType<typeof vi.fn<(id: string, change: AllocationChange) => Observable<AdminBooking>>>;
    cancel: ReturnType<typeof vi.fn<(id: string, reason: string, version: number) => Observable<AdminBooking>>>;
  };

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    gateway = {
      getDay: vi.fn(() => of(ROWS)),
      getForm: vi.fn(() => of({ name: 'Client open', email: 'open@example.com', languages: ['hi'], notes: 'Work stress', consent: true, submittedAt: NOW })),
      getAaptaOptions: vi.fn(() => of([DEV])),
      allocate: vi.fn((id: string, change: AllocationChange) =>
        of({ ...ROWS.find((r) => r.id === id)!, aapta: DEV, bccEmailSent: change.bccEmailSent, version: 4 })),
      cancel: vi.fn((id: string, reason: string) =>
        of({ ...ROWS.find((r) => r.id === id)!, outcome: 'cancelled' as const, cancelReason: reason, cancellable: false })),
    };
    await TestBed.configureTestingModule({
      imports: [TodayPageComponent],
      providers: [{ provide: TodayGateway, useValue: gateway }],
    }).compileComponents();
    fixture = TestBed.createComponent(TodayPageComponent);
    host = fixture.nativeElement;
    document.body.appendChild(host);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
    host.remove();
  });

  const row = (id: string) =>
    [...host.querySelectorAll<HTMLElement>('tr[appBookingRow]')].find((tr) => tr.textContent?.includes(`Client ${id}`))!;
  const button = (scope: Element, label: string) =>
    [...scope.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === label);

  async function click(element: HTMLElement | undefined): Promise<void> {
    element!.click();
    await fixture.whenStable();
  }

  it("loads today's bookings and titles the page", async () => {
    expect(gateway.getDay).toHaveBeenCalledWith('2026-10-21');
    expect(host.querySelector('h1')?.textContent).toBe('Today');
    expect(host.querySelectorAll('tr[appBookingRow]')).toHaveLength(4);
  });

  it('makes a booking without an aapta stand out, and shows the client’s languages', () => {
    expect(row('open').dataset['state']).toBe('needs-aapta');
    expect(row('open').textContent).toContain('Needs an aapta');
    expect(row('open').textContent).toContain('Speaks Hindi, English');
    expect(row('held').textContent).toContain('Was Aanya M.');
  });

  it('shows the outcome the aapta recorded, read-only', () => {
    expect(row('done').querySelector('.badge')?.textContent).toBe('Completed');
    expect(button(row('done'), 'Update')).toBeUndefined();
    expect(row('open').textContent).toContain('After 16:00');
  });

  it('says when a booking further ahead can be assigned', () => {
    expect(button(row('later'), 'Assign')).toBeUndefined();
    expect(row('later').textContent).toContain('You can assign from Fri 23 Oct, 10:00');
  });

  it('assigns an aapta, keeping BCC until one is chosen', async () => {
    await click(button(row('open'), 'Assign'));

    expect(gateway.getAaptaOptions).toHaveBeenCalledWith('open');
    const checkbox = row('open').querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    expect(checkbox.disabled).toBe(true);

    const select = row('open').querySelector<HTMLSelectElement>('select')!;
    select.value = 'ap_2';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    checkbox.click();
    await fixture.whenStable();
    await click(button(row('open'), 'Save'));

    expect(gateway.allocate).toHaveBeenCalledWith('open', { aaptaId: 'ap_2', bccEmailSent: true, version: 3 });
    expect(row('open').textContent).toContain('Dev P.');
    expect(host.querySelector('.toast')?.textContent).toContain('Client open is with Dev Patel');
  });

  it('only edits one row at a time', async () => {
    await click(button(row('open'), 'Assign'));

    expect(button(row('held'), 'Update')?.disabled).toBe(true);
  });

  it('reloads when someone else changed the booking first', async () => {
    gateway.allocate.mockReturnValue(throwError(() => new ApiError('CONCURRENT_UPDATE')));
    await click(button(row('held'), 'Update'));
    const select = row('held').querySelector<HTMLSelectElement>('select')!;
    row('held').querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await fixture.whenStable();
    expect(select).toBeTruthy();
    await click(button(row('held'), 'Save'));

    expect(gateway.getDay).toHaveBeenCalledTimes(2);
    expect(host.querySelector('.toast')?.textContent).toContain('Someone else changed this booking');
  });

  it('needs a reason to cancel, and offers keeping the booking first', async () => {
    await click(button(row('open'), 'Cancel booking'));
    const dialog = host.querySelector('dialog')!;
    const actions = [...dialog.querySelectorAll('.cancel__actions button')].map((b) => b.textContent?.trim());
    expect(actions).toEqual(['Keep booking', 'Cancel booking']);

    dialog.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(gateway.cancel).not.toHaveBeenCalled();
    expect(dialog.textContent).toContain('Add a reason');

    const reason = dialog.querySelector<HTMLTextAreaElement>('textarea')!;
    reason.value = 'Client asked by email';
    reason.dispatchEvent(new Event('input'));
    dialog.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(gateway.cancel).toHaveBeenCalledWith('open', 'Client asked by email', 3);
    expect(row('open').querySelector('.badge')?.textContent).toBe('Cancelled');
    expect(row('open').textContent).toContain('Client asked by email');
  });

  it('shows what the client entered', async () => {
    await click(button(row('open'), 'View form'));

    expect(gateway.getForm).toHaveBeenCalledWith('open');
    expect(host.querySelector('dialog')?.textContent).toContain('Work stress');
  });
});

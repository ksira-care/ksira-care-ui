import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AvailabilityGateway } from './availability.gateway';
import { AvailabilityError, Slot, SlotChange } from './availability.models';
import { AvailabilityStore } from './availability.store';

const ist = (isoLocal: string) => new Date(`${isoLocal}+05:30`);
const NOW = ist('2026-10-03T15:30');

const slot = (time: string, status: Slot['status'], id: string | null = time): Slot => ({
  id,
  start: ist(time),
  status,
});

const SLOTS = [
  slot('2026-10-03T16:00', 'open'),
  slot('2026-10-03T18:00', 'booked'),
  slot('2026-10-05T09:00', 'open'),
  slot('2026-10-05T10:00', 'closed'),
];

describe('AvailabilityStore', () => {
  let store: AvailabilityStore;
  let gateway: {
    getSlots: ReturnType<typeof vi.fn<() => Observable<Slot[]>>>;
    saveChanges: ReturnType<typeof vi.fn<(c: readonly SlotChange[]) => Observable<void>>>;
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    gateway = {
      getSlots: vi.fn(() => of(SLOTS)),
      saveChanges: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [AvailabilityStore, { provide: AvailabilityGateway, useValue: gateway }],
    });
    store = TestBed.inject(AvailabilityStore);
    TestBed.tick(); // let the slots resource load
  });

  afterEach(() => vi.useRealTimers());

  it('loads today through 60 days ahead in one request', () => {
    expect(gateway.getSlots).toHaveBeenCalledWith({
      start: ist('2026-10-03T00:00'),
      end: ist('2026-12-03T00:00'),
    });
  });

  it('treats hours with no record as closed', () => {
    expect(store.statusOf(ist('2026-10-05T11:00'))).toBe('closed');
  });

  it('toggles hours and tracks only real changes', () => {
    store.toggle(ist('2026-10-05T10:00'));
    store.toggle(ist('2026-10-05T09:00'));

    expect(store.statusOf(ist('2026-10-05T10:00'))).toBe('open');
    expect(store.statusOf(ist('2026-10-05T09:00'))).toBe('closed');
    expect(store.changeCount()).toBe(2);

    store.toggle(ist('2026-10-05T10:00')); // back to how it was saved
    expect(store.changeCount()).toBe(1);
  });

  it('never changes booked or past hours', () => {
    store.toggle(ist('2026-10-03T18:00'));
    store.toggle(ist('2026-10-03T10:00'));

    expect(store.statusOf(ist('2026-10-03T18:00'))).toBe('booked');
    expect(store.statusOf(ist('2026-10-03T10:00'))).toBe('closed');
    expect(store.changeCount()).toBe(0);
  });

  it('opens or closes every changeable hour of a day at once', () => {
    store.setDay('2026-10-03', true);

    expect(store.statusOf(ist('2026-10-03T15:00'))).toBe('closed'); // already started
    expect(store.statusOf(ist('2026-10-03T17:00'))).toBe('open');
    expect(store.statusOf(ist('2026-10-03T18:00'))).toBe('booked');
    // 17:00, 19:00–23:00 change; 16:00 was already open.
    expect(store.changeCount()).toBe(6);
  });

  it('summarises each day for the calendar', () => {
    store.toggle(ist('2026-10-05T10:00'));

    expect(store.summaries().get('2026-10-05')).toEqual({ open: 2, booked: 0, changed: true });
    expect(store.summaries().get('2026-10-03')).toEqual({ open: 1, booked: 1, changed: false });
  });

  it('saves only the changes, then clears them', () => {
    store.toggle(ist('2026-10-05T10:00'));
    store.toggle(ist('2026-10-06T12:00'));
    store.save();

    expect(gateway.saveChanges).toHaveBeenCalledWith([
      { id: '2026-10-05T10:00', start: ist('2026-10-05T10:00'), open: true },
      { id: null, start: ist('2026-10-06T12:00'), open: true },
    ]);
    expect(store.changeCount()).toBe(0);
    expect(store.statusOf(ist('2026-10-05T10:00'))).toBe('open');
    expect(store.justSaved()).toBe(true);
  });

  it('keeps changes and reloads when an hour was booked meanwhile', () => {
    gateway.saveChanges.mockReturnValue(throwError(() => new AvailabilityError('conflict')));
    store.toggle(ist('2026-10-05T10:00'));
    store.save();
    TestBed.tick();

    expect(store.saveError()).toBe('conflict');
    expect(store.changeCount()).toBe(1);
    expect(gateway.getSlots).toHaveBeenCalledTimes(2);
  });

  it('can discard everything', () => {
    store.toggle(ist('2026-10-05T10:00'));
    store.discard();

    expect(store.changeCount()).toBe(0);
    expect(store.statusOf(ist('2026-10-05T10:00'))).toBe('closed');
  });

  it('warns when nothing is open in the next seven days', () => {
    expect(store.nothingOpenThisWeek()).toBe(false);

    store.setDay('2026-10-03', false);
    store.setDay('2026-10-05', false);

    expect(store.nothingOpenThisWeek()).toBe(true);
  });

  it('ignores a second save while one is in flight', () => {
    gateway.saveChanges.mockReturnValue(new Subject<void>());
    store.toggle(ist('2026-10-05T10:00'));
    store.save();
    store.save();

    expect(gateway.saveChanges).toHaveBeenCalledTimes(1);
    expect(store.saving()).toBe(true);
  });
});

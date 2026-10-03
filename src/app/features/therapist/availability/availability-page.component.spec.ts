import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AvailabilityGateway } from './availability.gateway';
import { Slot, SlotChange } from './availability.models';
import { AvailabilityPageComponent } from './availability-page.component';

const ist = (isoLocal: string) => new Date(`${isoLocal}+05:30`);
const NOW = ist('2026-10-03T15:30');

const SLOTS: Slot[] = [
  { id: 'a', start: ist('2026-10-03T16:00'), status: 'open' },
  { id: 'b', start: ist('2026-10-03T18:00'), status: 'booked' },
  { id: 'c', start: ist('2026-10-05T09:00'), status: 'open' },
];

describe('AvailabilityPageComponent', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;
  let host: HTMLElement;
  let saveChanges: ReturnType<typeof vi.fn<(c: readonly SlotChange[]) => Observable<void>>>;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    saveChanges = vi.fn(() => of(undefined));

    await TestBed.configureTestingModule({
      imports: [AvailabilityPageComponent],
      providers: [
        { provide: AvailabilityGateway, useValue: { getSlots: () => of(SLOTS), saveChanges } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AvailabilityPageComponent);
    host = fixture.nativeElement;
    document.body.appendChild(host);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
    host.remove();
  });

  const hourButton = (time: string) =>
    [...host.querySelectorAll<HTMLButtonElement>('button.hour')].find(
      (b) => b.textContent?.trim() === time,
    )!;
  const hourState = (time: string) =>
    [...host.querySelectorAll<HTMLElement>('.hour')]
      .find((el) => el.textContent?.trim().startsWith(time))
      ?.getAttribute('data-state');

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await fixture.whenStable();
  }

  it("opens on today with past, booked and open hours shown correctly", () => {
    expect(host.querySelector('#day-heading')?.textContent).toBe('Saturday, 3 October');
    expect(hourState('10:00')).toBe('past');
    expect(hourState('16:00')).toBe('open');
    expect(hourState('18:00')).toBe('booked');
    expect(hourState('19:00')).toBe('closed');
    expect(host.querySelector('.save-bar')).toBeNull();
  });

  it('shows the save bar after a change and saves it', async () => {
    await click(hourButton('19:00'));

    expect(hourButton('19:00').getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('.save-bar')?.textContent).toContain('1 unsaved change');
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);

    const save = [...host.querySelectorAll<HTMLButtonElement>('.save-bar button')].find((b) =>
      b.textContent?.includes('Save'),
    )!;
    await click(save);

    expect(saveChanges).toHaveBeenCalledWith([{ id: null, start: ist('2026-10-03T19:00'), open: true }]);
    expect(host.querySelector('.save-bar')).toBeNull();
    expect(host.querySelector('[role="status"]')?.textContent).toContain('Saved');
  });

  it('discards changes', async () => {
    await click(hourButton('19:00'));
    const discard = [...host.querySelectorAll<HTMLButtonElement>('.save-bar button')].find((b) =>
      b.textContent?.includes('Discard'),
    )!;
    await click(discard);

    expect(hourState('19:00')).toBe('closed');
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
  });

  it('switches days from the calendar', async () => {
    const monday = host.querySelector<HTMLButtonElement>('[data-date="2026-10-05"]')!;
    await click(monday);

    expect(host.querySelector('#day-heading')?.textContent).toBe('Monday, 5 October');
    expect(hourState('09:00')).toBe('open');
  });

  it('moves through the calendar with the arrow keys', async () => {
    const today = host.querySelector<HTMLButtonElement>('[data-date="2026-10-03"]')!;
    today.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();

    expect(host.querySelector('#day-heading')?.textContent).toBe('Saturday, 10 October');
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-10-10');
  });

  it('does not let you pick days before today', () => {
    expect(host.querySelector<HTMLButtonElement>('[data-date="2026-10-02"]')?.disabled).toBe(true);
  });

  it('opens every free hour of the day at once', async () => {
    const openAll = [...host.querySelectorAll<HTMLButtonElement>('.availability__bulk button')][0];
    await click(openAll);

    expect(['17:00', '19:00', '23:00'].map(hourState)).toEqual(['open', 'open', 'open']);
    expect(hourState('18:00')).toBe('booked');
    expect(host.querySelector('.save-bar')?.textContent).toContain('6 unsaved changes');
  });
});

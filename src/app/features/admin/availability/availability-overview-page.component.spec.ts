import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AvailabilityOverviewPageComponent } from './availability-overview-page.component';
import { AvailabilityOverviewGateway } from './availability-overview.gateway';
import { AvailabilityOverview } from './availability-overview.models';

const ist = (isoLocal: string) => new Date(`${isoLocal}+05:30`);
const NINE = ist('2026-10-21T09:00');
const TEN = ist('2026-10-21T10:00');

const DAY: AvailabilityOverview = {
  hours: [{ start: NINE, openAaptas: 1 }, { start: TEN, openAaptas: 0 }],
  aaptas: [
    {
      aapta: { id: 'ap_1', firstName: 'Aanya', lastName: 'Mehta' },
      cells: [
        { start: NINE, state: 'open', clientName: null },
        { start: TEN, state: 'booked', clientName: 'Farah Ali' },
      ],
    },
  ],
};

describe('AvailabilityOverviewPageComponent', () => {
  it('shows each aapta’s hours, who a booked hour is for, and hours with no one free', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(ist('2026-10-21T08:00'));
    const getDay = vi.fn(() => of(DAY));
    await TestBed.configureTestingModule({
      imports: [AvailabilityOverviewPageComponent],
      providers: [{ provide: AvailabilityOverviewGateway, useValue: { getDay } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(AvailabilityOverviewPageComponent);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    expect(getDay).toHaveBeenCalledWith('2026-10-21');
    expect(host.querySelector('tbody th')?.textContent).toBe('Aanya M.');
    const cells = [...host.querySelectorAll<HTMLElement>('tbody .cell')];
    expect(cells.map((c) => c.dataset['state'])).toEqual(['open', 'booked']);
    expect(cells[1].getAttribute('title')).toBe('10:00 · Booked for Farah Ali');
    const counts = [...host.querySelectorAll<HTMLElement>('tfoot td')];
    expect(counts.map((c) => c.textContent?.trim())).toEqual(['1', '0']);
    expect(counts[1].classList).toContain('grid__count--none');

    [...host.querySelectorAll<HTMLButtonElement>('.strip__day')].find((b) => b.textContent === 'Tomorrow')!.click();
    await fixture.whenStable();
    expect(getDay).toHaveBeenLastCalledWith('2026-10-22');
    vi.useRealTimers();
  });
});

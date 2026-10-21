import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HistoryPageComponent } from './history-page.component';
import { HistoryGateway } from './history.gateway';
import { HistoryMonth } from './history.models';

const ist = (isoLocal: string) => new Date(`${isoLocal}+05:30`);
const session = (id: string, start: string, overrides: object = {}) => ({
  id,
  start: ist(start),
  end: new Date(ist(start).getTime() + 3_600_000),
  client: { name: `Client ${id}`, email: `${id}@example.com` },
  aapta: { id: 'ap_1', firstName: 'Meera', lastName: 'Joshi' },
  outcome: 'completed' as const,
  refunded: false,
  notes: 'Short note.',
  ...overrides,
});

const OCTOBER: HistoryMonth = {
  month: '2026-10',
  months: ['2026-10', '2026-09'],
  summary: { total: 3, completed: 1, clientNoShow: 0, refunded: 1, cancelled: 1, pending: 0 },
  sessions: [
    session('a', '2026-10-11T13:00', { outcome: 'aapta-no-show', refunded: true, notes: 'x'.repeat(120) }),
    session('b', '2026-10-11T11:00'),
    session('c', '2026-10-07T19:00', { outcome: 'cancelled', aapta: null }),
  ],
  olderMonthsNotExported: ['2026-07'],
};

describe('HistoryPageComponent', () => {
  let fixture: ComponentFixture<HistoryPageComponent>;
  let host: HTMLElement;
  const getMonth = vi.fn(() => of(OCTOBER));
  const exportLastMonth = vi.fn(() => of({
    file: new Blob(['csv']), filename: 'ksira-sessions-2026-09.csv', deletedMonths: ['2026-07'], notExportedMonths: [],
  }));

  beforeEach(async () => {
    getMonth.mockClear();
    await TestBed.configureTestingModule({
      imports: [HistoryPageComponent],
      providers: [{ provide: HistoryGateway, useValue: { getMonth, exportLastMonth } }],
    }).compileComponents();
    fixture = TestBed.createComponent(HistoryPageComponent);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('offers this month and last as tabs, and the headline numbers', () => {
    expect([...host.querySelectorAll('[role="tab"]')].map((t) => t.textContent?.trim())).toEqual([
      'October (this month)',
      'September',
    ]);
    expect([...host.querySelectorAll('.tile dd')].map((d) => d.textContent)).toEqual(['3', '1', '1']);
    expect(host.textContent).toContain("0 clients didn't join · 1 cancelled · 0 not marked yet");
  });

  it('groups sessions by day so each row only shows its time', () => {
    const days = [...host.querySelectorAll('.history__day th')].map((th) => th.textContent?.trim());
    expect(days).toEqual(['Sunday, 11 October', 'Wednesday, 7 October']);
    expect(host.querySelector('.history__time')?.textContent).toBe('13:00');
    expect(host.textContent).toContain('Refund the client');
  });

  it('folds long notes until asked', async () => {
    const more = host.querySelector<HTMLButtonElement>('.history__more')!;
    expect(host.querySelector('.history__note--folded')).not.toBeNull();

    more.click();
    await fixture.whenStable();

    expect(host.querySelector('.history__note--folded')).toBeNull();
  });

  it('warns about older months nobody exported', () => {
    expect(host.textContent).toContain('Kept because they were never exported: July 2026');
  });

  it('exports last month, whichever is on screen, and reports what was deleted', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const exportButton = [...host.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes('Export'))!;
    expect(exportButton.textContent).toContain('Export September (CSV)');

    exportButton.click();
    await fixture.whenStable();

    expect(exportLastMonth).toHaveBeenCalled();
    expect(host.textContent).toContain('Downloaded ksira-sessions-2026-09.csv. Deleted older months: July 2026.');
  });

  it('loads the month chosen', async () => {
    host.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
    await fixture.whenStable();

    expect(getMonth).toHaveBeenLastCalledWith('2026-09');
  });
});

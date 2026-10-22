import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ApiError } from '../../core/http/api-error';
import { LanguagesGateway } from '../../core/languages/languages.gateway';
import { MOCK_LANGUAGES } from '../../core/languages/mock-languages.gateway';
import { BookingGateway } from '../../features/booking/booking.gateway';
import { BookableHour, BookingConfirmation, BookingRequest } from '../../features/booking/booking.models';
import { BookComponent } from './book.component';

const hour = (iso: string): BookableHour => ({ start: new Date(iso), end: new Date(new Date(iso).getTime() + 3_600_000) });
const HOURS = [hour('2026-10-23T04:30:00Z'), hour('2026-10-23T05:30:00Z'), hour('2026-10-24T10:30:00Z')];

describe('BookComponent', () => {
  let fixture: ComponentFixture<BookComponent>;
  let host: HTMLElement;
  let getBookableHours: ReturnType<typeof vi.fn<(languages: readonly string[], until: Date) => Observable<BookableHour[]>>>;
  let book: ReturnType<typeof vi.fn<(request: BookingRequest) => Observable<BookingConfirmation>>>;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-22T06:00:00Z'));
    getBookableHours = vi.fn(() => of(HOURS));
    book = vi.fn((request: BookingRequest) => of({ id: 'bk_1', start: request.start, end: new Date(request.start.getTime() + 3_600_000) }));
    await TestBed.configureTestingModule({
      imports: [BookComponent],
      providers: [
        provideRouter([]),
        { provide: BookingGateway, useValue: { getBookableHours, book } },
        { provide: LanguagesGateway, useValue: { getLanguages: () => of([...MOCK_LANGUAGES]) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BookComponent);
    host = fixture.nativeElement;
    window.scrollTo = vi.fn();
    await fixture.whenStable();
  });

  afterEach(() => vi.useRealTimers());

  async function click(element: HTMLElement | null | undefined): Promise<void> {
    element!.click();
    await fixture.whenStable();
  }

  const language = (name: string) =>
    [...host.querySelectorAll<HTMLLabelElement>('app-language-picker label')].find((l) => l.textContent?.trim() === name)!
      .querySelector('input')!;

  function type(selector: string, value: string): void {
    const input = host.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function chooseFirstTime(): Promise<void> {
    await click(host.querySelector<HTMLButtonElement>('.cal__day--free'));
    await click(host.querySelector<HTMLButtonElement>('.cal__slot'));
  }

  async function fillAboutYou(): Promise<void> {
    type('#name', 'Tom Hughes');
    type('#email', 'Tom@Example.com ');
    await click(host.querySelector<HTMLInputElement>('.consent-checkbox'));
  }

  async function submit(): Promise<void> {
    host.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('asks for languages before showing times', () => {
    expect(host.textContent).toContain("Choose a language to see the times we're free.");
    expect(getBookableHours).not.toHaveBeenCalled();
  });

  it('offers only the free hours for the languages chosen, on the hour', async () => {
    await click(language('Hindi'));

    expect(getBookableHours).toHaveBeenCalledWith(['hi'], expect.any(Date));
    expect(host.querySelectorAll('.cal__day--free')).toHaveLength(2);
    await click(host.querySelector<HTMLButtonElement>('.cal__day--free'));
    const times = [...host.querySelectorAll('.cal__slot')].map((b) => b.textContent?.trim());
    expect(times).toEqual(['10:00 AM', '11:00 AM']);
    expect(host.textContent).toContain('All times are India time (IST).');
  });

  it('books the chosen hour without payment while payments are off', async () => {
    await click(language('Hindi'));
    await click(language('English'));
    await chooseFirstTime();
    await fillAboutYou();
    expect(host.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Confirm booking');

    await submit();

    expect(book).toHaveBeenCalledWith({
      name: 'Tom Hughes', email: 'tom@example.com', start: HOURS[0].start, languages: ['hi', 'en'], notes: null,
    });
    expect(host.textContent).toContain("You're booked.");
    expect(host.textContent).toContain('Tom@Example.com');
  });

  it('needs a language, a time, a name, an email and consent', async () => {
    await submit();

    expect(book).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Choose at least one language.');
    expect(host.textContent).toContain('Please enter your name');
    expect(host.textContent).toContain('You must accept this to continue.');
  });

  it('shows fresh times when the hour was just taken', async () => {
    book.mockReturnValue(throwError(() => new ApiError('TIME_NOT_AVAILABLE')));
    await click(language('Hindi'));
    await chooseFirstTime();
    await fillAboutYou();

    await submit();

    expect(host.querySelector('[role="alert"].notice')?.textContent).toContain('that time was just taken');
    expect(getBookableHours).toHaveBeenCalledTimes(2);
    expect(host.querySelector('.cal__slot--selected')).toBeNull();
  });

  it('says so when no one is free for those languages', async () => {
    getBookableHours.mockReturnValue(of([]));
    await click(language('Kannada'));

    expect(host.textContent).toContain('No free times in the next 60 days');
  });
});

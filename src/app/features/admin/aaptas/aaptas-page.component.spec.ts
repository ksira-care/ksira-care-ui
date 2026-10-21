import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { ApiError } from '../../../core/http/api-error';
import { LanguagesGateway } from '../../../core/languages/languages.gateway';
import { MOCK_LANGUAGES } from '../../../core/languages/mock-languages.gateway';
import { AaptasPageComponent } from './aaptas-page.component';
import { AaptasGateway } from './aaptas.gateway';
import { AaptaAccount, NewAapta } from './aaptas.models';

const ANYA: AaptaAccount = {
  id: 'ap_1', email: 'aanya@ksiracare.com', firstName: 'Aanya', middleName: null, lastName: 'Mehta',
  phone: '+919876543210', dateOfBirth: null, languages: ['en', 'hi'], address: null,
};

describe('AaptasPageComponent', () => {
  let fixture: ComponentFixture<AaptasPageComponent>;
  let host: HTMLElement;
  let gateway: {
    getRoster: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn<(aapta: NewAapta) => Observable<AaptaAccount>>>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    gateway = {
      getRoster: vi.fn(() => of([ANYA])),
      create: vi.fn((aapta: NewAapta) => of({ ...ANYA, id: 'ap_2', ...aapta })),
      update: vi.fn((_id: string, changes: Partial<AaptaAccount>) => of({ ...ANYA, ...changes })),
      remove: vi.fn(() => of({ unallocatedBookings: 2 })),
    };
    await TestBed.configureTestingModule({
      imports: [AaptasPageComponent],
      providers: [
        { provide: AaptasGateway, useValue: gateway },
        { provide: LanguagesGateway, useValue: { getLanguages: () => of([...MOCK_LANGUAGES]) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AaptasPageComponent);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  const button = (label: string) =>
    [...host.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === label
      || b.getAttribute('aria-label') === label)!;

  function type(selector: string, value: string): void {
    const input = host.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await fixture.whenStable();
  }

  it('lists the roster with languages by name', () => {
    expect(host.textContent).toContain('1 on the roster');
    expect(host.querySelector('tbody tr')?.textContent).toContain('English, Hindi');
  });

  it('adds an aapta and shows their login once, with a generated password', async () => {
    await click(button('+ Add an aapta'));
    const password = host.querySelector<HTMLInputElement>('#new-password')!.value;
    expect(password.length).toBeGreaterThanOrEqual(8);

    type('#new-firstName', 'Neha');
    type('#new-lastName', 'Kapoor');
    type('#new-email', 'Neha@KsiraCare.com');
    await click(host.querySelector<HTMLInputElement>('app-language-picker input')!);
    host.querySelector('app-add-aapta-form form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(gateway.create).toHaveBeenCalledWith(expect.objectContaining({
      firstName: 'Neha', lastName: 'Kapoor', email: 'neha@ksiracare.com', middleName: null, password,
    }));
    expect(host.textContent).toContain('Neha Kapoor can sign in now');
    expect(host.querySelector('code')?.textContent).toBe(password);

    await click(button('Done'));
    expect(host.querySelector('code')).toBeNull();
  });

  it('explains a taken email', async () => {
    gateway.create.mockReturnValue(throwError(() => new ApiError('EMAIL_TAKEN')));
    await click(button('+ Add an aapta'));
    type('#new-firstName', 'Neha');
    type('#new-lastName', 'Kapoor');
    type('#new-email', 'aanya@ksiracare.com');
    await click(host.querySelector<HTMLInputElement>('app-language-picker input')!);
    host.querySelector('app-add-aapta-form form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(host.querySelector('[role="alert"]')?.textContent).toContain('already has an account');
  });

  it('warns that changing the email signs them out, and saves only what changed', async () => {
    await click(button('Edit Aanya Mehta'));
    type('#edit-email', 'aanya.m@ksiracare.com');
    await fixture.whenStable();
    expect(host.querySelector('dialog')?.textContent).toContain('signed out everywhere');

    host.querySelector('dialog form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(gateway.update).toHaveBeenCalledWith('ap_1', { email: 'aanya.m@ksiracare.com' });
  });

  it('removes an aapta only after confirming, and says what happened to their sessions', async () => {
    await click(button('Remove Aanya Mehta'));
    expect(gateway.remove).not.toHaveBeenCalled();
    expect(host.querySelector('dialog')?.textContent).toContain('Their login stops working straight away');

    await click(button('Remove aapta'));

    expect(gateway.remove).toHaveBeenCalledWith('ap_1');
    expect(host.querySelector('.toast')?.textContent).toContain('2 upcoming sessions need a new aapta');
    expect(host.querySelector('tbody')).toBeNull();
  });
});

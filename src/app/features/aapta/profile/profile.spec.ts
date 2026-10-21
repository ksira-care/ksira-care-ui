import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { LanguagesGateway } from '../../../core/languages/languages.gateway';
import { MOCK_LANGUAGES } from '../../../core/languages/mock-languages.gateway';
import { HttpProfileGateway } from './http-profile.gateway';
import { formatPhone, toE164 } from '../../../core/format/phone';
import { formatBirthDate } from './profile-format';
import { ProfilePageComponent } from './profile-page.component';
import { ProfileGateway } from './profile.gateway';
import { AaptaProfile, ProfileChanges } from './profile.models';

const PROFILE: AaptaProfile = {
  firstName: 'Aanya',
  middleName: null,
  lastName: 'Mehta',
  email: 'aanya@ksiracare.com',
  phone: '+919876543210',
  dateOfBirth: '1991-03-14',
  languages: ['en', 'hi', 'mr'],
  address: 'Flat 402, Green Meadows, Pune 411014',
};

describe('profile formatting', () => {
  it('groups Indian numbers and masks all but the first two and last three digits', () => {
    expect(formatPhone('+919876543210', { masked: false })).toBe('+91 98765 43210');
    expect(formatPhone('+91 98765-43210', { masked: true })).toBe('+91 98••• ••210');
  });

  it('masks other numbers without guessing their format', () => {
    expect(formatPhone('+447911123456', { masked: true })).toBe('+44•••••••456');
  });

  it('shows birthdays as calendar dates, with no timezone shift', () => {
    expect(formatBirthDate('1991-03-14')).toBe('14 Mar 1991');
    expect(formatBirthDate('1991-01-01')).toBe('1 Jan 1991');
  });

  it.each([
    ['98765 43210', '+919876543210'],
    ['+91 98765-43210', '+919876543210'],
    ['(+44) 7911 123456', '+447911123456'],
    ['12345', null],
    ['call me', null],
  ])('reads the phone number %s as %s', (typed, expected) => {
    expect(toE164(typed)).toBe(expected);
  });
});

describe('HttpProfileGateway', () => {
  let http: HttpTestingController;
  let gateway: HttpProfileGateway;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpProfileGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    gateway = TestBed.inject(HttpProfileGateway);
  });

  afterEach(() => http.verify());

  it('reads /aaptas/me', async () => {
    const result = firstValueFrom(gateway.getProfile());

    http.expectOne({ method: 'GET', url: '/api/aaptas/me' }).flush({ aaptaId: 'ap_1', ...PROFILE });

    expect(await result).toEqual(PROFILE);
  });

  it('sends only the changes, clearing a field with an empty string', async () => {
    const result = firstValueFrom(gateway.updateProfile({ phone: null, languages: ['en'] }));

    const req = http.expectOne({ method: 'PATCH', url: '/api/aaptas/me' });
    expect(req.request.body).toEqual({ phone: '', languages: ['en'] });
    req.flush({ aaptaId: 'ap_1', ...PROFILE, phone: null, languages: ['en'] });

    expect((await result).phone).toBeNull();
  });
});

describe('ProfilePageComponent', () => {
  let fixture: ComponentFixture<ProfilePageComponent>;
  let host: HTMLElement;
  let updateProfile: ReturnType<typeof vi.fn<(changes: ProfileChanges) => Observable<AaptaProfile>>>;
  let refresh: ReturnType<typeof vi.fn>;

  async function render(response: Observable<AaptaProfile>): Promise<void> {
    updateProfile = vi.fn((changes: ProfileChanges) => of({ ...PROFILE, ...changes } as AaptaProfile));
    refresh = vi.fn(() => of(undefined));
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        { provide: ProfileGateway, useValue: { getProfile: () => response, updateProfile } },
        { provide: LanguagesGateway, useValue: { getLanguages: () => of([...MOCK_LANGUAGES]) } },
        { provide: AuthService, useValue: { refresh, changePassword: () => of(undefined) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProfilePageComponent);
    host = fixture.nativeElement;
    await fixture.whenStable();
  }

  const fields = () =>
    Object.fromEntries(
      [...host.querySelectorAll('.field')].map((field) => [
        field.querySelector('dt')?.textContent?.trim(),
        field.querySelector('dd span')?.textContent?.trim(),
      ]),
    );

  const button = (label: string) =>
    [...host.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === label)!;

  async function edit(): Promise<void> {
    button('Edit').click();
    await fixture.whenStable();
  }

  function type(selector: string, value: string): void {
    const input = host.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function save(): Promise<void> {
    host.querySelector<HTMLFormElement>('app-profile-form form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('shows every detail', async () => {
    await render(of(PROFILE));

    expect(fields()).toEqual({
      'Full name': 'Aanya Mehta',
      Email: 'aanya@ksiracare.com',
      Phone: '+91 98••• ••210',
      'Date of birth': '14 Mar 1991',
      Languages: 'English, Hindi, Marathi',
      Address: 'Flat 402, Green Meadows, Pune 411014',
    });
  });

  it('reveals the phone number on request', async () => {
    await render(of(PROFILE));
    const reveal = host.querySelector<HTMLButtonElement>('.field__reveal')!;

    reveal.click();
    await fixture.whenStable();

    expect(fields()['Phone']).toBe('+91 98765 43210');
    expect(reveal.getAttribute('aria-pressed')).toBe('true');
  });

  it('marks missing details instead of leaving blanks', async () => {
    await render(of({ ...PROFILE, phone: null, dateOfBirth: null, address: null }));

    expect(fields()['Phone']).toBe('Not provided');
    expect(fields()['Date of birth']).toBe('Not provided');
    expect(host.querySelector('.field__reveal')).toBeNull();
  });

  it('offers a retry when loading fails', async () => {
    await render(throwError(() => new Error('boom')));

    expect(host.querySelector('[role="alert"]')?.textContent).toContain("couldn't load your profile");
  });

  it('lets the aapta edit their details, but not their email', async () => {
    await render(of(PROFILE));
    await edit();

    expect(host.querySelector('#profile-firstName')).not.toBeNull();
    expect(host.querySelector('input[type="email"], #profile-email')).toBeNull();
    expect(host.textContent).toContain('To change it, contact your coordinator.');
  });

  it('saves only what changed, with the phone in E.164', async () => {
    await render(of(PROFILE));
    await edit();
    type('#profile-phone', '91234 56789');
    type('#profile-address', '  ');
    await save();

    expect(updateProfile).toHaveBeenCalledWith({ phone: '+919123456789', address: null });
    expect(fields()['Address']).toBe('Not provided');
    expect(host.textContent).toContain('Your details are saved.');
  });

  it('refreshes the name in the header after a rename', async () => {
    await render(of(PROFILE));
    await edit();
    type('#profile-firstName', 'Ananya');
    await save();

    expect(updateProfile).toHaveBeenCalledWith({ firstName: 'Ananya' });
    expect(refresh).toHaveBeenCalled();
  });

  it('does not save invalid details', async () => {
    await render(of(PROFILE));
    await edit();
    type('#profile-lastName', '   ');
    type('#profile-phone', '12345');
    await save();

    expect(updateProfile).not.toHaveBeenCalled();
    expect(host.textContent).toContain('This is required.');
    expect(host.textContent).toContain('Enter a phone number');
  });

  it('requires at least one language', async () => {
    await render(of({ ...PROFILE, languages: ['en'] }));
    await edit();
    host.querySelector<HTMLInputElement>('app-language-picker input:checked')!.click();
    await save();

    expect(updateProfile).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Choose at least one language.');
  });

  it('warns before leaving with unsaved edits', async () => {
    await render(of(PROFILE));
    await edit();
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);

    type('#profile-firstName', 'Ananya');

    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
  });
});

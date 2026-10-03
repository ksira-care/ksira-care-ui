import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { HttpProfileGateway } from './http-profile.gateway';
import { formatAddress, formatBirthDate, formatPhone } from './profile-format';
import { ProfilePageComponent } from './profile-page.component';
import { ProfileGateway } from './profile.gateway';
import { TherapistProfile } from './profile.models';

const PROFILE: TherapistProfile = {
  fullName: 'Aanya Mehta',
  email: 'aanya@ksiracare.com',
  phone: '+919876543210',
  dateOfBirth: '1991-03-14',
  languages: ['en', 'hi', 'mr'],
  address: {
    line1: 'Flat 402, Green Meadows',
    line2: null,
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411014',
    country: 'IN',
  },
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

  it('writes the address the way it would go on an envelope', () => {
    expect(formatAddress(PROFILE.address!)).toBe('Flat 402, Green Meadows, Pune 411014');
  });
});

describe('HttpProfileGateway', () => {
  it('reads /therapists/me and assembles the full name', async () => {
    TestBed.configureTestingModule({
      providers: [
        HttpProfileGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const result = firstValueFrom(TestBed.inject(HttpProfileGateway).getProfile());

    http.expectOne({ method: 'GET', url: '/api/therapists/me' }).flush({
      therapistId: 'th_1',
      email: 'aanya@ksiracare.com',
      firstName: 'Aanya',
      middleName: 'Priya',
      lastName: 'Mehta',
      phone: '+919876543210',
      dateOfBirth: '1991-03-14',
      languages: ['en'],
      address: { line1: 'Flat 402', city: 'Pune', postalCode: '411014' },
    });
    const profile = await result;

    expect(profile.fullName).toBe('Aanya Priya Mehta');
    expect(profile.address?.line2).toBeNull();
    http.verify();
  });
});

describe('ProfilePageComponent', () => {
  let fixture: ComponentFixture<ProfilePageComponent>;
  let host: HTMLElement;

  async function render(response: Observable<TherapistProfile>): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [{ provide: ProfileGateway, useValue: { getProfile: () => response } }],
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

  it('shows every detail, without a display name', async () => {
    await render(of(PROFILE));

    expect(fields()).toEqual({
      'Full name': 'Aanya Mehta',
      Email: 'aanya@ksiracare.com',
      Phone: '+91 98••• ••210',
      'Date of birth': '14 Mar 1991',
      Languages: 'English, Hindi, Marathi',
      Address: 'Flat 402, Green Meadows, Pune 411014',
    });
    expect(host.textContent).not.toContain('Display name');
    expect(host.textContent).toContain('contact your coordinator');
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
});

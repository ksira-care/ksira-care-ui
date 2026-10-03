import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthError, AuthenticatedUser, LoginCredentials } from '../../../core/auth/auth.models';
import { LoginComponent } from './login.component';

const USER: AuthenticatedUser = { id: 'th_1', name: 'Asha Rao', email: 'asha@ksiracare.com' };

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let host: HTMLElement;
  let login: ReturnType<typeof vi.fn<(c: LoginCredentials) => Observable<AuthenticatedUser>>>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  async function setup(queryParams: Record<string, string> = {}): Promise<void> {
    login = vi.fn(() => of(USER));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(LoginComponent);
    host = fixture.nativeElement;
    await fixture.whenStable();
  }

  function query<T extends HTMLElement>(selector: string): T {
    return host.querySelector<T>(selector)!;
  }

  function type(selector: string, value: string): void {
    const input = query<HTMLInputElement>(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function submit(): Promise<void> {
    query<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('shows validation errors and does not call the API when the form is empty', async () => {
    await setup();
    await submit();

    expect(host.textContent).toContain('Enter your email address.');
    expect(host.textContent).toContain('Enter your password.');
    expect(login).not.toHaveBeenCalled();
  });

  it('signs in with a trimmed email and goes to the portal home', async () => {
    await setup();
    type('#login-email', '  asha@ksiracare.com ');
    type('#login-password', 'secret');
    await submit();

    expect(login).toHaveBeenCalledWith({ email: 'asha@ksiracare.com', password: 'secret' });
    expect(navigateByUrl).toHaveBeenCalledWith('/therapist');
  });

  it('returns to a safe returnUrl after signing in', async () => {
    await setup({ returnUrl: '/therapist/sessions' });
    type('#login-email', USER.email);
    type('#login-password', 'secret');
    await submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/therapist/sessions');
  });

  it('ignores a returnUrl that leaves the portal', async () => {
    await setup({ returnUrl: '//evil.example' });
    type('#login-email', USER.email);
    type('#login-password', 'secret');
    await submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/therapist');
  });

  it('shows the error and clears the password when credentials are wrong', async () => {
    await setup();
    login.mockReturnValue(throwError(() => new AuthError('invalid-credentials')));
    type('#login-email', USER.email);
    type('#login-password', 'wrong');
    await submit();

    expect(query('[role="alert"]').textContent).toContain('Email or password is incorrect.');
    expect(query<HTMLInputElement>('#login-password').value).toBe('');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('prevents double submission while a request is in flight', async () => {
    await setup();
    login.mockReturnValue(new Subject<AuthenticatedUser>());
    type('#login-email', USER.email);
    type('#login-password', 'secret');
    await submit();
    await submit();

    expect(login).toHaveBeenCalledTimes(1);
    expect(query<HTMLButtonElement>('button[type="submit"]').disabled).toBe(true);
  });

  it('explains why the therapist is here after their session expired', async () => {
    await setup({ reason: 'session-expired', returnUrl: '/therapist' });

    expect(query('[role="status"]').textContent).toContain('Your session has expired');
  });

  it('shows no expiry notice on a normal visit', async () => {
    await setup();

    expect(host.querySelector('[role="status"]')).toBeNull();
  });

  it('toggles password visibility', async () => {
    await setup();
    const toggle = query<HTMLButtonElement>('.password-field__toggle');

    toggle.click();
    fixture.detectChanges();

    expect(query<HTMLInputElement>('#login-password').type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });
});

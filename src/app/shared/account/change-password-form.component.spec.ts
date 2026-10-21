import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { PasswordChange, PasswordChangeError } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { ChangePasswordFormComponent } from './change-password-form.component';

describe('ChangePasswordFormComponent', () => {
  let fixture: ComponentFixture<ChangePasswordFormComponent>;
  let host: HTMLElement;
  let changePassword: ReturnType<typeof vi.fn<(change: PasswordChange) => Observable<void>>>;

  beforeEach(async () => {
    changePassword = vi.fn(() => of(undefined));
    await TestBed.configureTestingModule({
      imports: [ChangePasswordFormComponent],
      providers: [{ provide: AuthService, useValue: { changePassword } }],
    }).compileComponents();
    fixture = TestBed.createComponent(ChangePasswordFormComponent);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  function type(id: string, value: string): void {
    const input = host.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function submit(current: string, next: string, confirm = next): Promise<void> {
    type('current-password', current);
    type('new-password', next);
    type('confirm-password', confirm);
    host.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('changes the password and says other devices were signed out', async () => {
    await submit('old-password', 'new-password');

    expect(changePassword).toHaveBeenCalledWith({ currentPassword: 'old-password', newPassword: 'new-password' });
    expect(host.textContent).toContain('signed out on your other devices');
    expect(host.querySelector<HTMLInputElement>('#new-password')!.value).toBe('');
  });

  it('checks the length and the confirmation before asking the server', async () => {
    await submit('old-password', 'short');
    expect(host.textContent).toContain('Use 8–72 characters');

    await submit('old-password', 'new-password', 'new-passwrd');
    expect(host.textContent).toContain("The passwords don't match.");

    expect(changePassword).not.toHaveBeenCalled();
  });

  it('points at the current password when the server rejects it', async () => {
    changePassword.mockReturnValue(throwError(() => new PasswordChangeError('current-password-incorrect')));

    await submit('wrong-password', 'new-password');

    expect(host.querySelector('#current-password-error')?.textContent).toContain('incorrect');
  });
});

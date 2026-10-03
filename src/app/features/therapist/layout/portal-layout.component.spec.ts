import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { PortalLayoutComponent } from './portal-layout.component';

describe('PortalLayoutComponent', () => {
  async function render() {
    const logout = vi.fn(() => of(undefined));
    const user = signal({ id: 'th_1', name: 'Aanya Mehta', email: 'a@k.com' });

    await TestBed.configureTestingModule({
      imports: [PortalLayoutComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { user, logout } }],
    }).compileComponents();

    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PortalLayoutComponent);
    await fixture.whenStable();
    return { fixture, host: fixture.nativeElement as HTMLElement, logout, navigateByUrl };
  }

  it('shows the account menu for the signed-in therapist', async () => {
    const { host } = await render();

    expect(host.querySelector('.account__avatar')?.textContent).toBe('AM');
  });

  it('only links to sections that exist', async () => {
    const { host } = await render();
    const links = [...host.querySelectorAll('.portal-header__link')].map((a) => a.textContent?.trim());

    expect(links).toEqual(['Dashboard', 'Availability', 'Bookings', 'Profile']);
  });

  it('signs out and returns to the login page', async () => {
    const { fixture, host, logout, navigateByUrl } = await render();

    host.querySelector<HTMLButtonElement>('.account__trigger')!.click();
    await fixture.whenStable();
    [...host.querySelectorAll<HTMLElement>('[role="menuitem"]')]
      .find((item) => item.textContent?.includes('Sign out'))!
      .click();

    expect(logout).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/therapist/login');
  });
});

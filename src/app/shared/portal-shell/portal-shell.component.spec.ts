import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AaptaLayoutComponent } from '../../features/aapta/layout/aapta-layout.component';

describe('PortalShellComponent (as the aapta portal uses it)', () => {
  async function render() {
    const logout = vi.fn(() => of(undefined));
    const user = signal({ id: 'ap_1', name: 'Aanya Mehta', email: 'a@k.com', role: 'aapta' });

    await TestBed.configureTestingModule({
      imports: [AaptaLayoutComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { user, logout } }],
    }).compileComponents();

    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AaptaLayoutComponent);
    await fixture.whenStable();
    return { fixture, host: fixture.nativeElement as HTMLElement, logout, navigateByUrl };
  }

  it('shows the account menu for the signed-in user', async () => {
    const { host } = await render();

    expect(host.querySelector('.account__avatar')?.textContent).toBe('AM');
  });

  it("links to the portal's sections", async () => {
    const { host } = await render();
    const links = [...host.querySelectorAll<HTMLAnchorElement>('.portal-header__link')].map((a) => [
      a.textContent?.trim(),
      a.getAttribute('href'),
    ]);

    expect(links).toEqual([
      ['Dashboard', '/aapta'],
      ['Availability', '/aapta/availability'],
      ['Bookings', '/aapta/bookings'],
      ['Profile', '/aapta/profile'],
    ]);
  });

  it('signs out and returns to the sign-in page', async () => {
    const { fixture, host, logout, navigateByUrl } = await render();

    host.querySelector<HTMLButtonElement>('.account__trigger')!.click();
    await fixture.whenStable();
    [...host.querySelectorAll<HTMLElement>('[role="menuitem"]')]
      .find((item) => item.textContent?.includes('Sign out'))!
      .click();

    expect(logout).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });
});

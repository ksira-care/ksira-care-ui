import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccountMenuComponent } from './account-menu.component';

describe('AccountMenuComponent', () => {
  let fixture: ComponentFixture<AccountMenuComponent>;
  let host: HTMLElement;
  let signOut: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountMenuComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AccountMenuComponent);
    fixture.componentRef.setInput('name', 'Aanya Mehta');
    fixture.componentRef.setInput('email', 'aanya@ksiracare.com');
    fixture.componentRef.setInput('profilePath', '/therapist/profile');
    signOut = vi.fn<() => void>();
    fixture.componentInstance.signOut.subscribe(signOut);
    host = fixture.nativeElement;
    document.body.appendChild(host);
    await fixture.whenStable();
  });

  afterEach(() => host.remove());

  const trigger = () => host.querySelector<HTMLButtonElement>('.account__trigger')!;
  const menu = () => host.querySelector<HTMLElement>('[role="menu"]');
  const items = () => [...host.querySelectorAll<HTMLElement>('[role="menuitem"]')];
  const profileItem = () => items()[0];
  const signOutItem = () => items().find((i) => i.textContent?.includes('Sign')) as HTMLButtonElement;

  async function press(target: HTMLElement, key: string): Promise<void> {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await fixture.whenStable();
  }

  async function click(target: HTMLElement): Promise<void> {
    target.click();
    await fixture.whenStable();
  }

  it('shows only the initials until opened, with a descriptive label', () => {
    expect(host.querySelector('.account__avatar')?.textContent).toBe('AM');
    expect(trigger().textContent).not.toContain('Aanya');
    expect(trigger().getAttribute('aria-label')).toBe('Account menu for Aanya Mehta');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(menu()).toBeNull();
  });

  it('opens on click, shows who is signed in, and focuses the first item', async () => {
    await click(trigger());

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(menu()?.textContent).toContain('Aanya Mehta');
    expect(menu()?.textContent).toContain('aanya@ksiracare.com');
    expect(items().map((i) => i.textContent?.trim())).toEqual(['Your profile', 'Sign out']);
    expect(document.activeElement).toBe(profileItem());
  });

  it('links to the profile page', async () => {
    await click(trigger());

    expect(profileItem().getAttribute('href')).toBe('/therapist/profile');
  });

  it('opens from the keyboard and moves between items with the arrows', async () => {
    await press(trigger(), 'ArrowDown');
    expect(document.activeElement).toBe(profileItem());

    await press(profileItem(), 'ArrowDown');
    expect(document.activeElement).toBe(signOutItem());
  });

  it('closes on Escape and returns focus to the button', async () => {
    await click(trigger());
    await press(profileItem(), 'Escape');

    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes when clicking elsewhere on the page', async () => {
    await click(trigger());
    await click(document.body);

    expect(menu()).toBeNull();
  });

  it('emits signOut when Sign out is chosen', async () => {
    await click(trigger());
    await click(signOutItem());

    expect(signOut).toHaveBeenCalledOnce();
  });

  it('disables Sign out while signing out', async () => {
    fixture.componentRef.setInput('signingOut', true);
    await click(trigger());

    expect(signOutItem().disabled).toBe(true);
    expect(signOutItem().textContent).toContain('Signing out…');
  });
});

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { NavigationWaitComponent } from './navigation-wait.component';

@Component({ template: 'Done' })
class PageComponent {}

describe('NavigationWaitComponent', () => {
  it('says the server is waking up when a navigation waits a long time', async () => {
    vi.useFakeTimers();
    const gate = new Subject<boolean>();
    TestBed.configureTestingModule({
      imports: [NavigationWaitComponent],
      providers: [provideRouter([{ path: 'slow', component: PageComponent, canMatch: [() => firstValueFrom(gate)] }])],
    });
    const fixture = TestBed.createComponent(NavigationWaitComponent);
    const host: HTMLElement = fixture.nativeElement;
    const navigation = TestBed.inject(Router).navigateByUrl('/slow');

    await vi.advanceTimersByTimeAsync(500);
    fixture.detectChanges();
    expect(host.textContent?.trim()).toBe('');

    await vi.advanceTimersByTimeAsync(5000);
    fixture.detectChanges();
    expect(host.textContent).toContain('Waking up Ksira Care');

    gate.next(true);
    await navigation;
    fixture.detectChanges();
    expect(host.querySelector('[role="status"]')).toBeNull();
    vi.useRealTimers();
  });
});

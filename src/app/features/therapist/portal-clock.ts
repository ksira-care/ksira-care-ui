import { DestroyRef, Signal, inject, signal } from '@angular/core';

/**
 * The current time as a signal, refreshed every `refreshMs`, so countdowns
 * ("In 45 min") and "now" markers stay correct while the page is open.
 * Call from an injection context; the timer stops when the caller is destroyed.
 */
export function injectNow(refreshMs = 30_000): Signal<Date> {
  const now = signal(new Date());
  const timer = setInterval(() => now.set(new Date()), refreshMs);
  inject(DestroyRef).onDestroy(() => clearInterval(timer));
  return now.asReadonly();
}

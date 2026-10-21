import { Observable, defer, switchMap, timer } from 'rxjs';

const LATENCY_MS = 400;

/** Runs `work` after a short delay, like a network call; errors it throws arrive delayed too. */
export function respond<T>(work: () => T): Observable<T> {
  return timer(LATENCY_MS).pipe(switchMap(() => defer(async () => work())));
}

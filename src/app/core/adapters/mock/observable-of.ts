import { delay, Observable, of } from 'rxjs';

const MOCK_LATENCY_MS = 180;

export function asMockStream<T>(value: T): Observable<T> {
  return of(value).pipe(delay(MOCK_LATENCY_MS));
}

import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollChrome {
  readonly headerHidden = signal(false);
  readonly atTop = signal(true);
}

import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly messages = signal<readonly ToastMessage[]>([]);

  success(text: string, ms = 4200): void {
    this.show(text, 'success', ms);
  }

  error(text: string, ms = 5200): void {
    this.show(text, 'error', ms);
  }

  info(text: string, ms = 4200): void {
    this.show(text, 'info', ms);
  }

  show(text: string, tone: ToastTone = 'success', ms = 4200): void {
    const id = this.nextId++;
    this.messages.update((current) => [...current, { id, tone, text }]);
    if (ms > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), ms),
      );
    }
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.messages.update((current) => current.filter((item) => item.id !== id));
  }

  clear(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.messages.set([]);
  }
}

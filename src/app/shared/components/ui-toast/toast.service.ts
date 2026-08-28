import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  title: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly messages = signal<readonly ToastMessage[]>([]);

  success(title: string, description = '', ms = 4200): void {
    this.show(title, description, 'success', ms);
  }

  error(title: string, description = '', ms = 5200): void {
    this.show(title, description, 'error', ms);
  }

  info(title: string, description = '', ms = 4200): void {
    this.show(title, description, 'info', ms);
  }

  show(title: string, description = '', tone: ToastTone = 'success', ms = 4200): void {
    const id = this.nextId++;
    this.messages.update((current) => [...current, { id, tone, title, description }]);
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

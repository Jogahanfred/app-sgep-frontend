import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import type { FaqItem } from '@core/domain/entities';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './accordion.html',
  styleUrl: './accordion.scss',
})
export class Accordion {
  readonly items = input<FaqItem[]>([]);
  readonly openId = signal<string | null>(null);

  isOpen(id: string): boolean {
    return this.openId() === id;
  }

  toggle(id: string): void {
    this.openId.update((current) => (current === id ? null : id));
  }

  onKeydown(event: KeyboardEvent, id: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle(id);
    }
  }
}

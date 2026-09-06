import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-accordion-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './accordion-item.html',
  styleUrl: './accordion.scss',
})
export class AccordionItem {
  readonly itemId = input.required<string>();
  readonly open = input(false);
  readonly toggle = output<string>();

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle.emit(this.itemId());
    }
  }
}

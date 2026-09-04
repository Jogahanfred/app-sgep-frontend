import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { NavGroup } from '@shared/models/nav.model';

@Component({
  selector: 'app-navigation-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navigation-menu.html',
  styleUrl: './navigation-menu.scss',
})
export class NavigationMenu {
  readonly groups = input.required<NavGroup[]>();
  readonly openLabel = input<string | null>(null);
  readonly openLabelChange = output<string | null>();

  toggle(label: string): void {
    this.openLabelChange.emit(this.openLabel() === label ? null : label);
  }

  onTriggerKey(event: KeyboardEvent, label: string): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.openLabelChange.emit(label);
    }
    if (event.key === 'Escape') {
      this.openLabelChange.emit(null);
    }
  }
}

import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { NavGroup } from '@shared/models/nav.model';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { Icon } from '@shared/components/icon/icon';

@Component({
  selector: 'app-navigation-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, ClickOutsideDirective, Icon],
  templateUrl: './navigation-menu.html',
  styleUrl: './navigation-menu.scss',
})
export class NavigationMenu {
  readonly groups = input.required<NavGroup[]>();
  readonly openGroup = signal<string | null>(null);

  toggle(label: string): void {
    this.openGroup.update((current) => (current === label ? null : label));
  }

  close(): void {
    this.openGroup.set(null);
  }

  onTriggerKey(event: KeyboardEvent, label: string): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.openGroup.set(label);
    }
    if (event.key === 'Escape') {
      this.close();
    }
  }
}

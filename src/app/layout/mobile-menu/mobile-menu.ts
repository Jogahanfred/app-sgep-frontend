import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { NavGroup } from '@shared/models/nav.model';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';

@Component({
  selector: 'app-mobile-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  templateUrl: './mobile-menu.html',
  styleUrl: './mobile-menu.scss',
})
export class MobileMenu {
  readonly groups = input.required<NavGroup[]>();
  readonly open = input(false);
  readonly closed = output<void>();
  readonly loginRequested = output<void>();
  readonly openSection = signal<string | null>(null);

  toggle(label: string): void {
    this.openSection.update((current) => (current === label ? null : label));
  }

  close(): void {
    this.closed.emit();
    this.openSection.set(null);
  }

  requestLogin(): void {
    this.loginRequested.emit();
    this.close();
  }
}

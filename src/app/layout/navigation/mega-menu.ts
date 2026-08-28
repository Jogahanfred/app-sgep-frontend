import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { NavGroup } from '@shared/models/nav.model';

@Component({
  selector: 'app-mega-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './mega-menu.html',
  styleUrl: './mega-menu.scss',
})
export class MegaMenu {
  readonly group = input.required<NavGroup>();
  readonly navigated = output<void>();

  onNavigate(): void {
    this.navigated.emit();
  }
}

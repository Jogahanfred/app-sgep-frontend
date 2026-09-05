import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ProfileEmblemCardModel, ProfileEmblemSize } from '../../../types/profile-context.types';

@Component({
  selector: 'app-profile-emblem-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-emblem-card.html',
  styleUrl: './profile-emblem-card.scss',
  host: {
    '[class.is-sm]': 'size() === "sm"',
    '[class.is-lg]': 'size() === "lg"',
  },
})
export class ProfileEmblemCard {
  readonly card = input.required<ProfileEmblemCardModel>();
  readonly selected = input(false);
  readonly disabled = input(false);
  readonly size = input<ProfileEmblemSize>('md');
  readonly selectedChange = output<string>();

  pick(): void {
    if (this.disabled()) return;
    this.selectedChange.emit(this.card().id);
  }
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { EntityStatus } from '@core/domain/entities';

@Component({
  selector: 'ui-program-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './ui-program-card.html',
  styleUrl: './ui-program-card.scss',
})
export class UiProgramCard {
  readonly href = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input('');
  readonly kicker = input('');
  readonly imageUrl = input('');
  readonly imageAlt = input('');
  readonly typeBadge = input('');
  readonly status = input<EntityStatus | ''>('');
  readonly statusLabel = input('');
  readonly stats = input<readonly string[]>([]);
  readonly variant = input<'course' | 'create'>('course');
}

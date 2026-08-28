import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Promotion, PromotionVariant } from '@core/domain/entities';
import { Button } from '../button/button';

@Component({
  selector: 'app-promotion-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  templateUrl: './promotion-card.html',
  styleUrl: './promotion-card.scss',
})
export class PromotionCard {
  readonly promotion = input.required<Promotion>();
  readonly variant = input<PromotionVariant | undefined>(undefined);

  resolvedVariant(): PromotionVariant {
    return this.variant() ?? this.promotion().variant;
  }
}

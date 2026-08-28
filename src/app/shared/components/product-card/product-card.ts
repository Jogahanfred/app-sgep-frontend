import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Product } from '@core/domain/entities';
import { Badge } from '../badge/badge';
import { Button } from '../button/button';
import { Card } from '../card/card';
import { Icon, type IconName } from '../icon/icon';

const CATEGORY_ICON: Record<Product['category'], IconName> = {
  account: 'wallet',
  card: 'card',
  loan: 'credit',
  mortgage: 'home',
  investment: 'trend',
};

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Badge, Button, Icon],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly featured = input(false);
  readonly action = output<Product>();

  iconFor(category: Product['category']): IconName {
    return CATEGORY_ICON[category];
  }

  onAction(): void {
    this.action.emit(this.product());
  }
}

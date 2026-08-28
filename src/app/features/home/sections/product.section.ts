import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Product } from '@core/domain/entities';
import { Grid } from '@shared/components/grid/grid';
import { ProductCard } from '@shared/components/product-card/product-card';
import { Section } from '@shared/components/section/section';

@Component({
  selector: 'app-product-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Section, Grid, ProductCard],
  template: `
    <app-section [eyebrow]="eyebrow()" [title]="title()" [subtitle]="subtitle()" [tone]="tone()" [sectionId]="sectionId()">
      <app-grid [columns]="columns()">
        @for (product of products(); track product.id) {
          <app-product-card [product]="product" [featured]="featuredId() === product.id" />
        }
      </app-grid>
    </app-section>
  `,
})
export class ProductSection {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
  readonly eyebrow = input<string | undefined>(undefined);
  readonly products = input.required<Product[]>();
  readonly featuredId = input<string | undefined>(undefined);
  readonly tone = input<'default' | 'alt' | 'ink'>('default');
  readonly sectionId = input<string | undefined>(undefined);
  readonly columns = input(3);
}

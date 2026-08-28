import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Product } from '@core/domain/entities';
import { Alert } from '../alert/alert';
import { Breadcrumb } from '../breadcrumb/breadcrumb';
import { Container } from '../container/container';
import { Grid } from '../grid/grid';
import { HeroBanner } from '../hero-banner/hero-banner';
import { ProductCard } from '../product-card/product-card';
import { Section } from '../section/section';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  selector: 'app-product-catalog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Breadcrumb, HeroBanner, Section, Grid, ProductCard, Alert, Skeleton],
  template: `
    <app-container>
      <div class="cat-bc">
        <app-breadcrumb [crumbs]="[{ label: crumb() }]" />
      </div>
    </app-container>
    <app-hero-banner
      [compact]="true"
      [eyebrow]="eyebrow()"
      [title]="title()"
      [subtitle]="subtitle()"
      [primaryLabel]="primaryLabel()"
      [primaryHref]="primaryHref()"
      [secondaryLabel]="secondaryLabel()"
      [secondaryHref]="secondaryHref()"
    />
    <app-section [title]="listTitle()" [subtitle]="listSubtitle()">
      @if (status() === 'loading') {
        <app-grid>
          <app-skeleton height="16rem" />
          <app-skeleton height="16rem" />
          <app-skeleton height="16rem" />
        </app-grid>
      } @else if (status() === 'error') {
        <app-alert tone="error">No hemos podido cargar estos productos.</app-alert>
      } @else if (!products().length) {
        <app-alert>Todavía no hay productos en esta categoría.</app-alert>
      } @else {
        <app-grid [columns]="columns()">
          @for (product of products(); track product.id) {
            <app-product-card [product]="product" />
          }
        </app-grid>
      }
      <div class="cat-extra">
        <ng-content />
      </div>
    </app-section>
  `,
  styles: `
    .cat-bc {
      padding-top: var(--spacing-lg);
    }

    .cat-extra {
      margin-top: var(--spacing-2xl);
    }
  `,
})
export class ProductCatalog {
  readonly crumb = input.required<string>();
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly primaryLabel = input.required<string>();
  readonly primaryHref = input.required<string>();
  readonly secondaryLabel = input<string | undefined>(undefined);
  readonly secondaryHref = input<string | undefined>(undefined);
  readonly listTitle = input.required<string>();
  readonly listSubtitle = input<string | undefined>(undefined);
  readonly products = input.required<Product[]>();
  readonly status = input<'loading' | 'ready' | 'error'>('loading');
  readonly columns = input(3);
}

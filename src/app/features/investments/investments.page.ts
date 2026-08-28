import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { GetInvestmentProducts, mapInvestmentToProduct } from '@core/application';
import type { Product } from '@core/domain/entities';
import { ProductCatalog } from '@shared/components/product-catalog/product-catalog';

@Component({
  selector: 'app-investments-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCatalog],
  template: `
    <app-product-catalog
      crumb="Inversión"
      eyebrow="Inversión y ahorro"
      title="Invierte con un horizonte, no con un titular."
      subtitle="Fondos, huchas, jubilación y asesoría. El riesgo se explica del 1 al 7 antes de contratar."
      primaryLabel="Empezar con 50 €"
      primaryHref="/hazte-cliente"
      listTitle="Productos de inversión"
      [products]="products()"
      [status]="status()"
      [columns]="4"
    />
  `,
})
export class InvestmentsPage {
  private readonly getInvestments = inject(GetInvestmentProducts);
  readonly products = signal<Product[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.getInvestments
      .execute()
      .pipe(
        map((items) => items.map(mapInvestmentToProduct)),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (items) => {
          this.products.set(items);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }
}

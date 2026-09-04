import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { GetMortgages, mapMortgageToProduct } from '@core/application';
import type { Product } from '@core/domain/entities';
import { ProductCatalog } from '@shared/components/product-catalog/product-catalog';
import { MortgageCalculator } from '../../components/mortgage-calculator/mortgage-calculator';

@Component({
  selector: 'app-mortgages-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCatalog, MortgageCalculator],
  template: `
    <app-product-catalog
      crumb="Hipotecas"
      eyebrow="Vivienda"
      title="Fija, variable o mixta. Tú eliges el ritmo."
      subtitle="Hasta el 80% de financiación y un gestor que te acompaña desde la nota simple hasta la firma."
      primaryLabel="Calcular cuota"
      primaryHref="/hipotecas#simulador"
      listTitle="Hipotecas Helvia"
      [products]="products()"
      [status]="status()"
    >
      <div id="simulador">
        <app-mortgage-calculator />
      </div>
    </app-product-catalog>
  `,
})
export class MortgagesPage {
  private readonly getMortgages = inject(GetMortgages);
  readonly products = signal<Product[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.getMortgages
      .execute()
      .pipe(
        map((items) => items.map(mapMortgageToProduct)),
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

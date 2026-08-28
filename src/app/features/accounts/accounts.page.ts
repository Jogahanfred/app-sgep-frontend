import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { GetAccounts, mapAccountToProduct } from '@core/application';
import type { Product } from '@core/domain/entities';
import { ProductCatalog } from '@shared/components/product-catalog/product-catalog';

@Component({
  selector: 'app-accounts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCatalog],
  template: `
    <app-product-catalog
      crumb="Cuentas"
      eyebrow="Cuentas"
      title="El dinero de cada día, sin misterios."
      subtitle="Clara para la nómina, Lumbre para el colchón y Brújula si operas desde fuera. Comisiones escritas, no escondidas."
      primaryLabel="Hazte cliente"
      primaryHref="/hazte-cliente"
      secondaryLabel="Ver préstamos"
      secondaryHref="/prestamos"
      listTitle="Elige cuenta"
      listSubtitle="Todas las fichas reutilizan ProductCard. Un producto nuevo solo se añade al adaptador."
      [products]="products()"
      [status]="status()"
    />
  `,
})
export class AccountsPage {
  private readonly getAccounts = inject(GetAccounts);
  readonly products = signal<Product[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.getAccounts
      .execute()
      .pipe(
        map((accounts) => accounts.map(mapAccountToProduct)),
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

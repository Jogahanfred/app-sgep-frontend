import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { GetCards, mapCardToProduct } from '@core/application';
import type { Product } from '@core/domain/entities';
import { ProductCatalog } from '@shared/components/product-catalog/product-catalog';

@Component({
  selector: 'app-cards-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCatalog],
  template: `
    <app-product-catalog
      crumb="Tarjetas"
      eyebrow="Tarjetas"
      title="Paga, controla y viaja con una sola app."
      subtitle="Débito Delta, crédito Norte y Viajera. Congela, consulta el PIN y ajusta límites sin llamar."
      primaryLabel="Solicitar tarjeta"
      primaryHref="/hazte-cliente"
      listTitle="Nuestras tarjetas"
      [products]="products()"
      [status]="status()"
    />
  `,
})
export class CardsPage {
  private readonly getCards = inject(GetCards);
  readonly products = signal<Product[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.getCards
      .execute()
      .pipe(
        map((cards) => cards.map(mapCardToProduct)),
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

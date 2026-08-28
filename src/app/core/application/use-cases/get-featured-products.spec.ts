import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import type { NeedOption, Product, ProductCategory } from '../../domain/entities';
import type { ProductRepository } from '../../ports';
import { GetFeaturedProducts } from './get-featured-products';

class FakeProductRepository implements ProductRepository {
  constructor(private readonly featured: Product[]) {}

  getFeaturedProducts() {
    return of(this.featured);
  }

  getProductsByCategory(_category: ProductCategory) {
    return of([]);
  }

  getNeedOptions() {
    return of([] as NeedOption[]);
  }
}

describe('GetFeaturedProducts', () => {
  it('devuelve los productos del puerto sin transformarlos', async () => {
    const products: Product[] = [
      {
        id: 'cta-dia',
        title: 'Cuenta Día a Día',
        description: 'Sin comisiones de mantenimiento.',
        category: 'account',
        ctaLabel: 'Conocer cuenta',
        ctaHref: '/cuentas',
      },
    ];

    const useCase = new GetFeaturedProducts(new FakeProductRepository(products));
    const result = await firstValueFrom(useCase.execute());

    expect(result).toEqual(products);
  });
});

import { Observable } from 'rxjs';
import type { NeedOption, Product, ProductCategory } from '../../domain/entities';
import type { ProductRepository } from '../../ports';
import { FEATURED_PRODUCTS, NEED_OPTIONS } from './catalog.data';
import { asMockStream } from './observable-of';

export class MockProductRepository implements ProductRepository {
  getFeaturedProducts(): Observable<Product[]> {
    return asMockStream(FEATURED_PRODUCTS);
  }

  getProductsByCategory(category: ProductCategory): Observable<Product[]> {
    return asMockStream(FEATURED_PRODUCTS.filter((product) => product.category === category));
  }

  getNeedOptions(): Observable<NeedOption[]> {
    return asMockStream(NEED_OPTIONS);
  }
}

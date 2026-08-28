import { Observable } from 'rxjs';
import type { Product } from '../../domain/entities';
import type { ProductRepository } from '../../ports';

export class GetFeaturedProducts {
  constructor(private readonly products: ProductRepository) {}

  execute(): Observable<Product[]> {
    return this.products.getFeaturedProducts();
  }
}

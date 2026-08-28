import { map, Observable } from 'rxjs';
import type { NeedId, Product } from '../../domain/entities';
import type { ProductRepository } from '../../ports';

const NEED_TO_CATEGORY: Record<NeedId, Product['category']> = {
  finance: 'loan',
  protect: 'card',
  save: 'investment',
  home: 'mortgage',
  daily: 'account',
};

export class GetProductsByNeed {
  constructor(private readonly products: ProductRepository) {}

  execute(need: NeedId): Observable<Product[]> {
    return this.products.getProductsByCategory(NEED_TO_CATEGORY[need]);
  }
}

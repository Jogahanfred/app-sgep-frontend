import { Observable } from 'rxjs';
import type { NeedOption, Product, ProductCategory } from '../domain/entities';

export interface ProductRepository {
  getFeaturedProducts(): Observable<Product[]>;
  getProductsByCategory(category: ProductCategory): Observable<Product[]>;
  getNeedOptions(): Observable<NeedOption[]>;
}

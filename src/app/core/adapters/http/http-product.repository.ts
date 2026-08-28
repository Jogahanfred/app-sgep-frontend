import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { NeedOption, Product, ProductCategory } from '../../domain/entities';
import type { ProductRepository } from '../../ports';

/**
 * Adaptador HTTP listo para sustituir a MockProductRepository.
 * No se registra en la inyección de esta versión; ver README.
 */
export class HttpProductRepository implements ProductRepository {
  constructor(
    private readonly http: HttpClient,
    private readonly baseUrl = '/api',
  ) {}

  getFeaturedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products/featured`);
  }

  getProductsByCategory(category: ProductCategory): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`, { params: { category } });
  }

  getNeedOptions(): Observable<NeedOption[]> {
    return this.http.get<NeedOption[]>(`${this.baseUrl}/needs`);
  }
}

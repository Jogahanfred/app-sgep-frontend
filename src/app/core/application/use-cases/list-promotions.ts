import { Observable } from 'rxjs';
import type { PromotionEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListPromotions {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<PromotionEntity[]> {
    return this.catalog.listPromotions();
  }
}

import { Observable } from 'rxjs';
import type { PromotionEntity, PromotionWriteInput } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreatePromotion {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: PromotionWriteInput): Observable<PromotionEntity> {
    return this.catalog.createPromotion(input);
  }
}

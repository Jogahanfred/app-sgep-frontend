import { Observable } from 'rxjs';
import type { PromotionEntity, PromotionWriteInput } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdatePromotion {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: PromotionWriteInput): Observable<PromotionEntity> {
    return this.catalog.updatePromotion(id, input);
  }
}

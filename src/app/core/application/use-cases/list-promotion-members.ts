import { Observable } from 'rxjs';
import type { PromotionMemberEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListPromotionMembers {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(promotionId: string): Observable<PromotionMemberEntity[]> {
    return this.catalog.listPromotionMembers(promotionId);
  }
}

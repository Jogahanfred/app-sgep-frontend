import { Observable } from 'rxjs';
import type { PromotionMemberEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class SavePromotionMembers {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(promotionId: string, userIds: string[], entryDate: string): Observable<PromotionMemberEntity[]> {
    return this.catalog.savePromotionMembers(promotionId, userIds, entryDate);
  }
}

import { Observable } from 'rxjs';
import type { Promotion } from '../../domain/entities';
import type { PromotionRepository } from '../../ports';

export class GetPromotions {
  constructor(private readonly promotions: PromotionRepository) {}

  execute(): Observable<Promotion[]> {
    return this.promotions.getPromotions();
  }
}

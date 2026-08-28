import { Observable } from 'rxjs';
import type { Promotion } from '../domain/entities';

export interface PromotionRepository {
  getPromotions(): Observable<Promotion[]>;
}

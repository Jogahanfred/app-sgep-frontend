import { Observable } from 'rxjs';
import type { Promotion } from '../../domain/entities';
import type { PromotionRepository } from '../../ports';
import { PROMOTIONS } from './catalog.data';
import { asMockStream } from './observable-of';

export class MockPromotionRepository implements PromotionRepository {
  getPromotions(): Observable<Promotion[]> {
    return asMockStream(PROMOTIONS);
  }
}

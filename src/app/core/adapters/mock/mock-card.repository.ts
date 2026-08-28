import { Observable } from 'rxjs';
import type { BankCard } from '../../domain/entities';
import type { CardRepository } from '../../ports';
import { CARDS } from './catalog.data';
import { asMockStream } from './observable-of';

export class MockCardRepository implements CardRepository {
  getCards(): Observable<BankCard[]> {
    return asMockStream(CARDS);
  }
}

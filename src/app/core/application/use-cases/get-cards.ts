import { Observable } from 'rxjs';
import type { BankCard } from '../../domain/entities';
import type { CardRepository } from '../../ports';

export class GetCards {
  constructor(private readonly cards: CardRepository) {}

  execute(): Observable<BankCard[]> {
    return this.cards.getCards();
  }
}

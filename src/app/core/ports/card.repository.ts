import { Observable } from 'rxjs';
import type { BankCard } from '../domain/entities';

export interface CardRepository {
  getCards(): Observable<BankCard[]>;
}

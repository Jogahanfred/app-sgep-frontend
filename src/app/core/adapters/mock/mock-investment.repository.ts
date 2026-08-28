import { Observable } from 'rxjs';
import type { Investment } from '../../domain/entities';
import type { InvestmentRepository } from '../../ports';
import { INVESTMENTS } from './catalog.data';
import { asMockStream } from './observable-of';

export class MockInvestmentRepository implements InvestmentRepository {
  getInvestments(): Observable<Investment[]> {
    return asMockStream(INVESTMENTS);
  }
}

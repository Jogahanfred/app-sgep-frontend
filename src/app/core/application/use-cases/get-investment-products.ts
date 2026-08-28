import { Observable } from 'rxjs';
import type { Investment } from '../../domain/entities';
import type { InvestmentRepository } from '../../ports';

export class GetInvestmentProducts {
  constructor(private readonly investments: InvestmentRepository) {}

  execute(): Observable<Investment[]> {
    return this.investments.getInvestments();
  }
}

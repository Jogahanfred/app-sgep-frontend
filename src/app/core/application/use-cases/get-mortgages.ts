import { Observable } from 'rxjs';
import type { Mortgage } from '../../domain/entities';
import type { LoanRepository } from '../../ports';

export class GetMortgages {
  constructor(private readonly loans: LoanRepository) {}

  execute(): Observable<Mortgage[]> {
    return this.loans.getMortgages();
  }
}

import { Observable } from 'rxjs';
import type { Loan } from '../../domain/entities';
import type { LoanRepository } from '../../ports';

export class GetLoans {
  constructor(private readonly loans: LoanRepository) {}

  execute(): Observable<Loan[]> {
    return this.loans.getLoans();
  }
}

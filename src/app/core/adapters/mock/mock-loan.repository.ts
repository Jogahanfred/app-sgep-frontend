import { Observable } from 'rxjs';
import type { Loan, Mortgage } from '../../domain/entities';
import type { LoanRepository } from '../../ports';
import { LOANS, MORTGAGES } from './catalog.data';
import { asMockStream } from './observable-of';

export class MockLoanRepository implements LoanRepository {
  getLoans(): Observable<Loan[]> {
    return asMockStream(LOANS);
  }

  getMortgages(): Observable<Mortgage[]> {
    return asMockStream(MORTGAGES);
  }
}

import { Observable } from 'rxjs';
import type { Loan, Mortgage } from '../domain/entities';

export interface LoanRepository {
  getLoans(): Observable<Loan[]>;
  getMortgages(): Observable<Mortgage[]>;
}

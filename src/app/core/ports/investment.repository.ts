import { Observable } from 'rxjs';
import type { Investment } from '../domain/entities';

export interface InvestmentRepository {
  getInvestments(): Observable<Investment[]>;
}

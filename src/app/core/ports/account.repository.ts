import { Observable } from 'rxjs';
import type { Account } from '../domain/entities';

export interface AccountRepository {
  getAccounts(): Observable<Account[]>;
}

import { Observable } from 'rxjs';
import type { Account } from '../../domain/entities';
import type { AccountRepository } from '../../ports';
import { ACCOUNTS } from './catalog.data';
import { asMockStream } from './observable-of';

export class MockAccountRepository implements AccountRepository {
  getAccounts(): Observable<Account[]> {
    return asMockStream(ACCOUNTS);
  }
}

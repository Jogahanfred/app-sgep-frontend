import { Observable } from 'rxjs';
import type { Account } from '../../domain/entities';
import type { AccountRepository } from '../../ports';

export class GetAccounts {
  constructor(private readonly accounts: AccountRepository) {}

  execute(): Observable<Account[]> {
    return this.accounts.getAccounts();
  }
}

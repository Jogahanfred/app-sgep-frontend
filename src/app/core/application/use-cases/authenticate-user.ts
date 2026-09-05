import { Observable } from 'rxjs';
import type { OperationalIdentity } from '../../domain/entities/operational-context';
import type { AuthRepository } from '../../ports/auth.repository';

export class AuthenticateUser {
  constructor(private readonly auth: AuthRepository) {}

  execute(identifier: string, password: string): Observable<OperationalIdentity> {
    return this.auth.authenticate(identifier, password);
  }
}

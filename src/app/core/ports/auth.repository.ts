import { Observable } from 'rxjs';
import type { OperationalIdentity } from '../domain/entities/operational-context';

export interface AuthRepository {
  authenticate(identifier: string, password: string): Observable<OperationalIdentity>;
}

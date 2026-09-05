import { Observable, of, throwError, timer } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import type { OperationalIdentity } from '../../domain/entities/operational-context';
import { InvalidCredentialsError } from '../../domain/errors/domain-error';
import { resolveRoleCode } from '../../domain/services/profile-context-policy';
import type { AuthRepository } from '../../ports/auth.repository';
import { SEED_PASSWORDS, SEED_ROLES, SEED_USERS } from './admin.data';

const LATENCY = 180;
const GENERIC_ERROR = 'Identificador o contraseña incorrectos.';

export class MockAuthRepository implements AuthRepository {
  authenticate(identifier: string, password: string): Observable<OperationalIdentity> {
    const needle = identifier.trim().toLowerCase();
    const user = SEED_USERS.find(
      (item) =>
        item.email.toLowerCase() === needle ||
        item.documentNumber.toLowerCase() === needle ||
        (item.indicative ? item.indicative.toLowerCase() === needle : false) ||
        item.firstName.toLowerCase() === needle,
    );
    if (!user || user.status !== 'active') {
      return timer(LATENCY).pipe(switchMap(() => throwError(() => new InvalidCredentialsError(GENERIC_ERROR))));
    }
    if (SEED_PASSWORDS[user.id] !== password) {
      return timer(LATENCY).pipe(switchMap(() => throwError(() => new InvalidCredentialsError(GENERIC_ERROR))));
    }
    const roles = SEED_ROLES.filter((role) => user.roleIds.includes(role.id));
    try {
      const roleCode = resolveRoleCode(roles);
      return of({
        userId: user.id,
        displayName: user.firstName,
        roleCode,
        assignedUnitId: user.assignedUnitId,
        assignedSquadronId: user.assignedSquadronId,
      }).pipe(delay(LATENCY));
    } catch {
      return timer(LATENCY).pipe(switchMap(() => throwError(() => new InvalidCredentialsError(GENERIC_ERROR))));
    }
  }
}

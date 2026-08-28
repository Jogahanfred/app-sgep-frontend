import { defer, Observable } from 'rxjs';
import type { CatalogWriteInput, UserRoleEntity } from '../../domain/entities/admin-catalog';
import { assertCatalogWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreateUserRole {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: CatalogWriteInput): Observable<UserRoleEntity> {
    return defer(() => this.catalog.createRole(assertCatalogWrite(input, 'del rol')));
  }
}

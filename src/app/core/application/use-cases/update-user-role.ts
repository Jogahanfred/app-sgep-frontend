import { defer, Observable } from 'rxjs';
import type { CatalogWriteInput, UserRoleEntity } from '../../domain/entities/admin-catalog';
import { assertCatalogWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdateUserRole {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: CatalogWriteInput): Observable<UserRoleEntity> {
    return defer(() => this.catalog.updateRole(id, assertCatalogWrite(input, 'del rol')));
  }
}

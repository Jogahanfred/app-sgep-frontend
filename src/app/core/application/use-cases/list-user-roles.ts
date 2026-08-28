import { Observable } from 'rxjs';
import type { UserRoleEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListUserRoles {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<UserRoleEntity[]> {
    return this.catalog.listRoles();
  }
}

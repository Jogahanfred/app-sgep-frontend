import { Observable } from 'rxjs';
import type { UserEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListAdminUsers {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<UserEntity[]> {
    return this.catalog.listUsers();
  }
}

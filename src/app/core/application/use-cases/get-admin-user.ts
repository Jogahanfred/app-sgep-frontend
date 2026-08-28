import { Observable } from 'rxjs';
import type { UserEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class GetAdminUser {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string): Observable<UserEntity> {
    return this.catalog.getUser(id);
  }
}

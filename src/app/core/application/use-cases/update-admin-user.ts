import { defer, Observable } from 'rxjs';
import type { UserEntity, UserWriteInput } from '../../domain/entities/admin-catalog';
import { assertUserWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdateAdminUser {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: UserWriteInput): Observable<UserEntity> {
    return defer(() => this.catalog.updateUser(id, assertUserWrite(input, false)));
  }
}

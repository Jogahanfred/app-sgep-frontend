import { defer, Observable } from 'rxjs';
import type { OperationEntity, CatalogWriteInput } from '../../domain/entities/admin-catalog';
import { assertCatalogWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreateOperation {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: CatalogWriteInput): Observable<OperationEntity> {
    return defer(() => this.catalog.createOperation(assertCatalogWrite(input, 'de la operación')));
  }
}

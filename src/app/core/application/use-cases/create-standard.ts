import { defer, Observable } from 'rxjs';
import type { StandardEntity, StandardWriteInput } from '../../domain/entities/admin-catalog';
import { assertStandardWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreateStandard {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: StandardWriteInput): Observable<StandardEntity> {
    return defer(() => this.catalog.createStandard(assertStandardWrite(input)));
  }
}

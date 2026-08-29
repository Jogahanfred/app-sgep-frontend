import { defer, Observable } from 'rxjs';
import type { UnitEntity, UnitWriteInput } from '../../domain/entities/admin-catalog';
import { assertUnitWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreateUnit {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: UnitWriteInput): Observable<UnitEntity> {
    return defer(() => this.catalog.createUnit(assertUnitWrite(input)));
  }
}

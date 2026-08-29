import { defer, Observable } from 'rxjs';
import type { UnitEntity, UnitWriteInput } from '../../domain/entities/admin-catalog';
import { assertUnitWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdateUnit {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: UnitWriteInput): Observable<UnitEntity> {
    return defer(() => this.catalog.updateUnit(id, assertUnitWrite(input)));
  }
}

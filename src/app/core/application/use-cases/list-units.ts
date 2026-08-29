import { Observable } from 'rxjs';
import type { UnitEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListUnits {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<UnitEntity[]> {
    return this.catalog.listUnits();
  }
}

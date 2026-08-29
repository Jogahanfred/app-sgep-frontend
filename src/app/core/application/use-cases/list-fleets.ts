import { Observable } from 'rxjs';
import type { FleetEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListFleets {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<FleetEntity[]> {
    return this.catalog.listFleets();
  }
}

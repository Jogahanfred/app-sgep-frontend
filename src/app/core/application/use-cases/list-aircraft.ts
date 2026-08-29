import { Observable } from 'rxjs';
import type { AircraftEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListAircraft {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<AircraftEntity[]> {
    return this.catalog.listAircraft();
  }
}

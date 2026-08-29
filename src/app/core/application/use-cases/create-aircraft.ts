import { defer, Observable } from 'rxjs';
import type { AircraftEntity, AircraftWriteInput } from '../../domain/entities/admin-catalog';
import { assertAircraftWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreateAircraft {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: AircraftWriteInput): Observable<AircraftEntity> {
    return defer(() => this.catalog.createAircraft(assertAircraftWrite(input)));
  }
}

import { defer, Observable } from 'rxjs';
import type { FleetEntity, FleetWriteInput } from '../../domain/entities/admin-catalog';
import { assertFleetWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreateFleet {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: FleetWriteInput): Observable<FleetEntity> {
    return defer(() => this.catalog.createFleet(assertFleetWrite(input)));
  }
}

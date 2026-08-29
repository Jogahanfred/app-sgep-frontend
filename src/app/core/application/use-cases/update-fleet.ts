import { defer, Observable } from 'rxjs';
import type { FleetEntity, FleetWriteInput } from '../../domain/entities/admin-catalog';
import { assertFleetWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdateFleet {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: FleetWriteInput): Observable<FleetEntity> {
    return defer(() => this.catalog.updateFleet(id, assertFleetWrite(input)));
  }
}

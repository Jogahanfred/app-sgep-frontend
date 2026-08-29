import { defer, Observable } from 'rxjs';
import type { ManeuverBankEntity, ManeuverBankWriteInput } from '../../domain/entities/admin-catalog';
import { assertManeuverWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdateManeuver {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: ManeuverBankWriteInput): Observable<ManeuverBankEntity> {
    return defer(() => this.catalog.updateManeuver(id, assertManeuverWrite(input)));
  }
}

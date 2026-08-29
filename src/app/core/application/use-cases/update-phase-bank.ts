import { defer, Observable } from 'rxjs';
import type { PhaseBankEntity, PhaseBankWriteInput } from '../../domain/entities/admin-catalog';
import { assertPhaseBankWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdatePhaseBank {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: PhaseBankWriteInput): Observable<PhaseBankEntity> {
    return defer(() => this.catalog.updatePhaseBank(id, assertPhaseBankWrite(input)));
  }
}

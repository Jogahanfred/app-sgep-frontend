import { defer, Observable } from 'rxjs';
import type { PhaseBankEntity, PhaseBankWriteInput } from '../../domain/entities/admin-catalog';
import { assertPhaseBankWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreatePhaseBank {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: PhaseBankWriteInput): Observable<PhaseBankEntity> {
    return defer(() => this.catalog.createPhaseBank(assertPhaseBankWrite(input)));
  }
}

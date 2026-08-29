import { defer, Observable } from 'rxjs';
import type { SubphaseBankEntity, SubphaseBankWriteInput } from '../../domain/entities/admin-catalog';
import { assertSubphaseBankWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdateSubphaseBank {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: SubphaseBankWriteInput): Observable<SubphaseBankEntity> {
    return defer(() => this.catalog.updateSubphaseBank(id, assertSubphaseBankWrite(input)));
  }
}

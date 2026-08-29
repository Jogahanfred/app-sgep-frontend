import { Observable } from 'rxjs';
import type { PhaseBankEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListPhaseBanks {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<PhaseBankEntity[]> {
    return this.catalog.listPhaseBanks();
  }
}

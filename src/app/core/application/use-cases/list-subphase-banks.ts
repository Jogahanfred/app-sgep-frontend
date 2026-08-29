import { Observable } from 'rxjs';
import type { SubphaseBankEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListSubphaseBanks {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<SubphaseBankEntity[]> {
    return this.catalog.listSubphaseBanks();
  }
}

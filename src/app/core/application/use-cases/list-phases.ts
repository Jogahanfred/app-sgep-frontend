import { Observable } from 'rxjs';
import type { PhaseEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListPhases {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<PhaseEntity[]> {
    return this.catalog.listPhases();
  }
}

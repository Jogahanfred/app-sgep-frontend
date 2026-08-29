import { Observable } from 'rxjs';
import type { SubphaseEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListSubphases {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<SubphaseEntity[]> {
    return this.catalog.listSubphases();
  }
}

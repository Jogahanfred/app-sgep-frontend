import { Observable } from 'rxjs';
import type { SquadronEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListSquadrons {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<SquadronEntity[]> {
    return this.catalog.listSquadrons();
  }
}

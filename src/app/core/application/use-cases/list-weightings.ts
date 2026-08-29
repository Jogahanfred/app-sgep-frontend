import { Observable } from 'rxjs';
import type { StandardWeightingEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListWeightings {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<StandardWeightingEntity[]> {
    return this.catalog.listWeightings();
  }
}

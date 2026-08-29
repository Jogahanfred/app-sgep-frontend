import { map, Observable } from 'rxjs';
import type { StandardEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListStandards {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<StandardEntity[]> {
    return this.catalog.listStandards().pipe(
      map((rows) => [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code, 'es'))),
    );
  }
}

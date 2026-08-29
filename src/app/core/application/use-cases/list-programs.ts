import { Observable } from 'rxjs';
import type { ProgramEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListPrograms {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<ProgramEntity[]> {
    return this.catalog.listPrograms();
  }
}

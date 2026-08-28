import { Observable } from 'rxjs';
import type { SpecialtyEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListSpecialties {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<SpecialtyEntity[]> {
    return this.catalog.listSpecialties();
  }
}

import { defer, Observable } from 'rxjs';
import type { CatalogWriteInput, SpecialtyEntity } from '../../domain/entities/admin-catalog';
import { assertCatalogWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdateSpecialty {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: CatalogWriteInput): Observable<SpecialtyEntity> {
    return defer(() => this.catalog.updateSpecialty(id, assertCatalogWrite(input, 'de la especialidad')));
  }
}

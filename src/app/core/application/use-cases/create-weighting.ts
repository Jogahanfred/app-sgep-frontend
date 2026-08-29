import { defer, Observable } from 'rxjs';
import type { StandardWeightingEntity, StandardWeightingWriteInput } from '../../domain/entities/admin-catalog';
import { assertWeightingWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreateWeighting {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: StandardWeightingWriteInput): Observable<StandardWeightingEntity> {
    return defer(() => this.catalog.createWeighting(assertWeightingWrite(input)));
  }
}

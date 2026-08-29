import { defer, Observable } from 'rxjs';
import type { StandardWeightingEntity, StandardWeightingWriteInput } from '../../domain/entities/admin-catalog';
import { assertWeightingWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdateWeighting {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: StandardWeightingWriteInput): Observable<StandardWeightingEntity> {
    return defer(() => this.catalog.updateWeighting(id, assertWeightingWrite(input)));
  }
}

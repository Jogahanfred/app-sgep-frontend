import { defer, Observable } from 'rxjs';
import type {
  TemporaryCommissionEntity,
  TemporaryCommissionWriteInput,
} from '../../domain/entities/admin-catalog';
import { assertCommissionWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdateTemporaryCommission {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: TemporaryCommissionWriteInput): Observable<TemporaryCommissionEntity> {
    return defer(() => this.catalog.updateTemporaryCommission(id, assertCommissionWrite(input)));
  }
}

import { defer, Observable } from 'rxjs';
import type {
  TemporaryCommissionEntity,
  TemporaryCommissionWriteInput,
} from '../../domain/entities/admin-catalog';
import { assertCommissionWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreateTemporaryCommission {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: TemporaryCommissionWriteInput): Observable<TemporaryCommissionEntity> {
    return defer(() => this.catalog.createTemporaryCommission(assertCommissionWrite(input)));
  }
}

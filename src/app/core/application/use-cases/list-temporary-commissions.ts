import { Observable } from 'rxjs';
import type { TemporaryCommissionEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListTemporaryCommissions {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<TemporaryCommissionEntity[]> {
    return this.catalog.listTemporaryCommissions();
  }
}

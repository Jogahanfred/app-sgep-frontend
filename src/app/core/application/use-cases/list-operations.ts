import { Observable } from 'rxjs';
import type { OperationEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListOperations {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<OperationEntity[]> {
    return this.catalog.listOperations();
  }
}

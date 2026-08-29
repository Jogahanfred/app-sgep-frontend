import { Observable } from 'rxjs';
import type { ManeuverBankEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListManeuvers {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<ManeuverBankEntity[]> {
    return this.catalog.listManeuvers();
  }
}

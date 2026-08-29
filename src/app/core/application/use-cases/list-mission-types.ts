import { Observable } from 'rxjs';
import type { MissionTypeEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListMissionTypes {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<MissionTypeEntity[]> {
    return this.catalog.listMissionTypes();
  }
}

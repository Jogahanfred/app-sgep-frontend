import { defer, Observable } from 'rxjs';
import type { MissionTypeEntity, MissionTypeWriteInput } from '../../domain/entities/admin-catalog';
import { assertMissionTypeWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreateMissionType {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: MissionTypeWriteInput): Observable<MissionTypeEntity> {
    return defer(() => this.catalog.createMissionType(assertMissionTypeWrite(input)));
  }
}

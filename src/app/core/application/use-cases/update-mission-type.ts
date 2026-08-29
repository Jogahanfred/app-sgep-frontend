import { defer, Observable } from 'rxjs';
import type { MissionTypeEntity, MissionTypeWriteInput } from '../../domain/entities/admin-catalog';
import { assertMissionTypeWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdateMissionType {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: MissionTypeWriteInput): Observable<MissionTypeEntity> {
    return defer(() => this.catalog.updateMissionType(id, assertMissionTypeWrite(input)));
  }
}

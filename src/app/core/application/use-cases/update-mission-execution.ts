import { Observable } from 'rxjs';
import type { MissionExecutionEntity, MissionExecutionWriteInput } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
export class UpdateMissionExecution { constructor(private readonly catalog: AdminCatalogRepository) {} execute(id: string, input: MissionExecutionWriteInput): Observable<MissionExecutionEntity> { return this.catalog.updateMissionExecution(id, input); } }

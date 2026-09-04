import { Observable } from 'rxjs';
import type { MissionExecutionEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
export class GetMissionExecution { constructor(private readonly catalog: AdminCatalogRepository) {} execute(id: string): Observable<MissionExecutionEntity> { return this.catalog.getMissionExecution(id); } }

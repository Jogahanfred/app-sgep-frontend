import { Observable } from 'rxjs';
import type { MissionExecutionEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
export class ListMissionExecutions { constructor(private readonly catalog: AdminCatalogRepository) {} execute(): Observable<MissionExecutionEntity[]> { return this.catalog.listMissionExecutions(); } }

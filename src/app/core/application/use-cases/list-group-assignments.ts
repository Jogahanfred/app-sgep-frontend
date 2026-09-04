import { Observable } from 'rxjs';
import type { GroupMissionAssignmentEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
export class ListGroupAssignments { constructor(private readonly catalog: AdminCatalogRepository) {} execute(): Observable<GroupMissionAssignmentEntity[]> { return this.catalog.listGroupAssignments(); } }

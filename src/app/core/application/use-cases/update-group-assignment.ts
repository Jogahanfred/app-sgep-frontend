import { Observable } from 'rxjs';
import type { GroupMissionAssignmentEntity, GroupMissionAssignmentWriteInput } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
export class UpdateGroupAssignment { constructor(private readonly catalog: AdminCatalogRepository) {} execute(id: string, input: GroupMissionAssignmentWriteInput): Observable<GroupMissionAssignmentEntity> { return this.catalog.updateGroupAssignment(id, input); } }

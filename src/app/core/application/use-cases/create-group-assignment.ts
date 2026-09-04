import { Observable } from 'rxjs';
import type { GroupMissionAssignmentEntity, GroupMissionAssignmentWriteInput } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
export class CreateGroupAssignment { constructor(private readonly catalog: AdminCatalogRepository) {} execute(input: GroupMissionAssignmentWriteInput): Observable<GroupMissionAssignmentEntity> { return this.catalog.createGroupAssignment(input); } }

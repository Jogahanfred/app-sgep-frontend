import { Observable } from 'rxjs';
import type { IndividualMissionAssignmentEntity, IndividualMissionAssignmentWriteInput } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
export class UpdateIndividualAssignment { constructor(private readonly catalog: AdminCatalogRepository) {} execute(id: string, input: IndividualMissionAssignmentWriteInput): Observable<IndividualMissionAssignmentEntity> { return this.catalog.updateIndividualAssignment(id, input); } }

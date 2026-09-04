import { Observable } from 'rxjs';
import type { IndividualMissionAssignmentEntity, IndividualMissionAssignmentWriteInput } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
export class CreateIndividualAssignment { constructor(private readonly catalog: AdminCatalogRepository) {} execute(input: IndividualMissionAssignmentWriteInput): Observable<IndividualMissionAssignmentEntity> { return this.catalog.createIndividualAssignment(input); } }

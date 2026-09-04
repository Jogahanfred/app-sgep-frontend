import { Observable } from 'rxjs';
import type { IndividualMissionAssignmentEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
export class ListIndividualAssignments { constructor(private readonly catalog: AdminCatalogRepository) {} execute(): Observable<IndividualMissionAssignmentEntity[]> { return this.catalog.listIndividualAssignments(); } }

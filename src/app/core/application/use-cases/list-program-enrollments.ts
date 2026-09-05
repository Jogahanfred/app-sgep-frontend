import { Observable } from 'rxjs';
import type { ProgramEnrollmentEntity } from '../../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class ListProgramEnrollments {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(): Observable<ProgramEnrollmentEntity[]> {
    return this.catalog.listProgramEnrollments();
  }
}

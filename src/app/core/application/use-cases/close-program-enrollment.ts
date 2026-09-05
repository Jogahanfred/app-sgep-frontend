import { defer, Observable } from 'rxjs';
import type { ProgramEnrollmentCloseInput, ProgramEnrollmentEntity } from '../../domain/entities/admin-catalog';
import { assertProgramEnrollmentClose } from '../../domain/services/program-enrollment';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CloseProgramEnrollment {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: ProgramEnrollmentCloseInput): Observable<ProgramEnrollmentEntity> {
    return defer(() => this.catalog.closeProgramEnrollment(id, assertProgramEnrollmentClose(input)));
  }
}

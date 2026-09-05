import { defer, Observable } from 'rxjs';
import type { ProgramEnrollmentEntity, ProgramEnrollmentWriteInput } from '../../domain/entities/admin-catalog';
import { assertProgramEnrollmentWrite } from '../../domain/services/program-enrollment';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class EnrollInProgram {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: ProgramEnrollmentWriteInput): Observable<ProgramEnrollmentEntity[]> {
    return defer(() => this.catalog.enrollInProgram(assertProgramEnrollmentWrite(input)));
  }
}

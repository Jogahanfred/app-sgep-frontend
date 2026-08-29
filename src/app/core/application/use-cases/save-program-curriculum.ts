import { defer, Observable } from 'rxjs';
import type { ProgramCurriculumWriteInput, ProgramEntity } from '../../domain/entities/admin-catalog';
import { assertProgramCurriculumWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class SaveProgramCurriculum {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: ProgramCurriculumWriteInput): Observable<ProgramEntity> {
    return defer(() => this.catalog.saveProgramCurriculum(assertProgramCurriculumWrite(input)));
  }
}

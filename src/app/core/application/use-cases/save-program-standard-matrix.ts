import { defer, Observable } from 'rxjs';
import type { ProgramEntity, ProgramStandardMatrixWriteInput } from '../../domain/entities/admin-catalog';
import { assertProgramStandardMatrixWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class SaveProgramStandardMatrix {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: ProgramStandardMatrixWriteInput): Observable<ProgramEntity> {
    return defer(() => this.catalog.saveProgramStandardMatrix(id, assertProgramStandardMatrixWrite(input)));
  }
}

import { defer, Observable } from 'rxjs';
import type { ProgramEntity } from '../../domain/entities/admin-catalog';
import { assertProgramStandardIds } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class AssignProgramStandards {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, standardIds: readonly string[]): Observable<ProgramEntity> {
    return defer(() => this.catalog.assignProgramStandards(id, assertProgramStandardIds(standardIds)));
  }
}

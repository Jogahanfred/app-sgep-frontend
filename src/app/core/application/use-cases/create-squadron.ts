import { defer, Observable } from 'rxjs';
import type { SquadronEntity, SquadronWriteInput } from '../../domain/entities/admin-catalog';
import { assertSquadronWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class CreateSquadron {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(input: SquadronWriteInput): Observable<SquadronEntity> {
    return defer(() => this.catalog.createSquadron(assertSquadronWrite(input)));
  }
}

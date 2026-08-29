import { defer, Observable } from 'rxjs';
import type { SquadronEntity, SquadronWriteInput } from '../../domain/entities/admin-catalog';
import { assertSquadronWrite } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export class UpdateSquadron {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(id: string, input: SquadronWriteInput): Observable<SquadronEntity> {
    return defer(() => this.catalog.updateSquadron(id, assertSquadronWrite(input)));
  }
}

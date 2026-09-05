import { map, Observable } from 'rxjs';
import type { OperationalContext, ProfileContextSelection } from '../../domain/entities/operational-context';
import { validateProfileSelection } from '../../domain/services/profile-context-policy';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { GetProfileContext } from './get-profile-context';

export class ConfirmProfileContext {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(userId: string, selection: ProfileContextSelection): Observable<OperationalContext> {
    return new GetProfileContext(this.catalog).execute(userId).pipe(
      map((snapshot) =>
        validateProfileSelection(snapshot.identity, selection, snapshot.units, snapshot.squadrons),
      ),
    );
  }
}

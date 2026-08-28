import { map, Observable, switchMap } from 'rxjs';
import type { AddressInput, UserProfile } from '../../domain/entities';
import { assertAddress } from '../../domain/services/user-profile';
import type { UserProfileRepository } from '../../ports';

export class UpdateUserAddress {
  constructor(private readonly users: UserProfileRepository) {}

  execute(input: AddressInput): Observable<UserProfile> {
    const data = assertAddress(input);
    return this.users.getCurrentUser().pipe(
      map((current) => ({ ...current, ...data })),
      switchMap((next) => this.users.save(next)),
    );
  }
}

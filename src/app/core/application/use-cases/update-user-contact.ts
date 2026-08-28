import { map, Observable, switchMap } from 'rxjs';
import type { ContactInput, UserProfile } from '../../domain/entities';
import { assertContact } from '../../domain/services/user-profile';
import type { UserProfileRepository } from '../../ports';

export class UpdateUserContact {
  constructor(private readonly users: UserProfileRepository) {}

  execute(input: ContactInput): Observable<UserProfile> {
    const data = assertContact(input);
    return this.users.getCurrentUser().pipe(
      map((current) => ({ ...current, ...data })),
      switchMap((next) => this.users.save(next)),
    );
  }
}

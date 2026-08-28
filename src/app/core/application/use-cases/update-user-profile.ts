import { defer, map, Observable, switchMap } from 'rxjs';
import type { PersonalDataInput, UserProfile } from '../../domain/entities';
import { assertPersonalData } from '../../domain/services/user-profile';
import type { UserProfileRepository } from '../../ports';

export class UpdateUserProfile {
  constructor(private readonly users: UserProfileRepository) {}

  execute(input: PersonalDataInput): Observable<UserProfile> {
    return defer(() => {
      const data = assertPersonalData(input);
      return this.users.getCurrentUser().pipe(
        map((current) => ({ ...current, ...data })),
        switchMap((next) => this.users.save(next)),
      );
    });
  }
}

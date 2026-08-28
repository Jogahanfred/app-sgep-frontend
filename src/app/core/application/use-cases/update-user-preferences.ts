import { map, Observable, switchMap } from 'rxjs';
import type { PreferenceInput, UserProfile } from '../../domain/entities';
import type { UserProfileRepository } from '../../ports';

export class UpdateUserPreferences {
  constructor(private readonly users: UserProfileRepository) {}

  execute(input: PreferenceInput): Observable<UserProfile> {
    return this.users.getCurrentUser().pipe(
      map((current) => ({ ...current, ...input })),
      switchMap((next) => this.users.save(next)),
    );
  }
}

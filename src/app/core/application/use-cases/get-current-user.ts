import { Observable } from 'rxjs';
import type { UserProfile } from '../../domain/entities';
import type { UserProfileRepository } from '../../ports';

export class GetCurrentUser {
  constructor(private readonly users: UserProfileRepository) {}

  execute(): Observable<UserProfile> {
    return this.users.getCurrentUser();
  }
}

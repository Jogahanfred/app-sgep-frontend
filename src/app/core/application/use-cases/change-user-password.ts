import { Observable } from 'rxjs';
import type { PasswordChangeInput, UserProfile } from '../../domain/entities';
import { assertPasswordChange } from '../../domain/services/user-profile';
import type { UserProfileRepository } from '../../ports';

export class ChangeUserPassword {
  constructor(private readonly users: UserProfileRepository) {}

  execute(input: PasswordChangeInput): Observable<UserProfile> {
    const nextPassword = assertPasswordChange(input);
    return this.users.changePassword(input.currentPassword, nextPassword);
  }
}

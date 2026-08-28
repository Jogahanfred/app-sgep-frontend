import { Observable } from 'rxjs';
import type { UserProfile } from '../domain/entities';

export interface UserProfileRepository {
  getCurrentUser(): Observable<UserProfile>;
  save(profile: UserProfile): Observable<UserProfile>;
  changePassword(currentPassword: string, newPassword: string): Observable<UserProfile>;
}

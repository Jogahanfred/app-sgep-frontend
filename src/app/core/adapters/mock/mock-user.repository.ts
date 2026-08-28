import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DEMO_PASSWORD, type UserProfile } from '../../domain/entities';
import { InvalidUserProfileError } from '../../domain/errors/domain-error';
import type { UserProfileRepository } from '../../ports';
import { DEMO_USER } from './user.data';

export class MockUserProfileRepository implements UserProfileRepository {
  private profile: UserProfile = { ...DEMO_USER };
  private password = DEMO_PASSWORD;

  getCurrentUser(): Observable<UserProfile> {
    return of(this.clone()).pipe(delay(160));
  }

  save(profile: UserProfile): Observable<UserProfile> {
    this.profile = { ...profile };
    return of(this.clone()).pipe(delay(160));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<UserProfile> {
    if (currentPassword !== this.password) {
      return throwError(() => new InvalidUserProfileError('La contraseña actual no es correcta.'));
    }
    this.password = newPassword;
    this.profile = { ...this.profile, lastPasswordChange: new Date().toISOString().slice(0, 10) };
    return of(this.clone()).pipe(delay(160));
  }

  private clone(): UserProfile {
    return { ...this.profile };
  }
}

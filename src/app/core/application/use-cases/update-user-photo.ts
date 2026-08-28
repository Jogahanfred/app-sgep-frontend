import { defer, map, Observable, switchMap } from 'rxjs';
import type { UserProfile } from '../../domain/entities';
import { assertPhotoDataUrl } from '../../domain/services/user-profile';
import type { UserProfileRepository } from '../../ports';

export class UpdateUserPhoto {
  constructor(private readonly users: UserProfileRepository) {}

  execute(photoUrl: string | null): Observable<UserProfile> {
    return defer(() => {
      const nextPhoto = assertPhotoDataUrl(photoUrl);
      return this.users.getCurrentUser().pipe(
        map((current) => ({ ...current, photoUrl: nextPhoto })),
        switchMap((next) => this.users.save(next)),
      );
    });
  }
}

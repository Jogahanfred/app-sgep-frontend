import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { GetAdminUser, ListSpecialties, ListUserRoles } from '@core/application';
import { statusLabel } from '@core/domain/services/admin-catalog';
import type { SpecialtyEntity, UserEntity, UserRoleEntity } from '@core/domain/entities';
import { Alert } from '@shared/components/alert/alert';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { ClientSession } from '../../../../../layout/client-session.service';

export type AssignmentKind = 'roles' | 'specialties';

@Component({
  selector: 'app-my-assignments-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, UiLoading],
  templateUrl: './my-assignments.page.html',
  styleUrl: './my-assignments.page.scss',
})
export class MyAssignmentsPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(ClientSession);
  private readonly getUser = inject(GetAdminUser);
  private readonly listRoles = inject(ListUserRoles);
  private readonly listSpecialties = inject(ListSpecialties);

  readonly kind = (this.route.snapshot.data['assignments'] as AssignmentKind) ?? 'roles';
  readonly user = signal<UserEntity | null>(null);
  readonly roles = signal<UserRoleEntity[]>([]);
  readonly specialties = signal<SpecialtyEntity[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly statusLabel = statusLabel;
  readonly isRoles = this.kind === 'roles';
  readonly title = this.isRoles ? 'Roles' : 'Especialidades';
  readonly lead = this.isRoles
    ? 'Los roles que tienes asignados en el sistema.'
    : 'Las especialidades vinculadas a tu usuario.';
  readonly empty = this.isRoles
    ? 'Aún no tienes roles asignados.'
    : 'Aún no tienes especialidades asignadas.';

  readonly items = computed(() => {
    const user = this.user();
    if (!user) return [];
    if (this.isRoles) {
      return this.roles().filter((role) => user.roleIds.includes(role.id));
    }
    return this.specialties().filter((item) => user.specialtyIds.includes(item.id));
  });

  constructor() {
    const id = this.session.userId();
    if (!id) {
      this.loadState.set('error');
      return;
    }
    forkJoin({
      user: this.getUser.execute(id),
      roles: this.listRoles.execute(),
      specialties: this.listSpecialties.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ user, roles, specialties }) => {
          this.user.set(user);
          this.roles.set(roles);
          this.specialties.set(specialties);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }
}

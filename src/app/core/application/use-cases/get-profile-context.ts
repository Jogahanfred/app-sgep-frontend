import { forkJoin, map, Observable, switchMap } from 'rxjs';
import type { SquadronEntity, UnitEntity, UserEntity, UserRoleEntity } from '../../domain/entities/admin-catalog';
import type { OperationalIdentity } from '../../domain/entities/operational-context';
import type { RoleCode } from '../../domain/entities/role-code';
import { ROLE_PROFILES } from '../../domain/entities/role-code';
import { InvalidProfileContextError } from '../../domain/errors/domain-error';
import {
  getProfileRequirements,
  resolveRoleCode,
  type ProfileRequirements,
} from '../../domain/services/profile-context-policy';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

export interface ProfileContextSnapshot {
  identity: OperationalIdentity;
  user: UserEntity;
  roleCode: RoleCode;
  roleName: string;
  requirements: ProfileRequirements;
  units: UnitEntity[];
  squadrons: SquadronEntity[];
}

export class GetProfileContext {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(userId: string): Observable<ProfileContextSnapshot> {
    return this.catalog.getUser(userId).pipe(
      switchMap((user) =>
        forkJoin({
          roles: this.catalog.listRoles(),
          units: this.catalog.listUnits(),
          squadrons: this.catalog.listSquadrons(),
        }).pipe(map((catalog) => this.toSnapshot(user, catalog.roles, catalog.units, catalog.squadrons))),
      ),
    );
  }

  private toSnapshot(
    user: UserEntity,
    roles: UserRoleEntity[],
    units: UnitEntity[],
    squadrons: SquadronEntity[],
  ): ProfileContextSnapshot {
    const assignedRoles = roles.filter((role) => user.roleIds.includes(role.id));
    const roleCode = resolveRoleCode(assignedRoles);
    const requirements = getProfileRequirements(roleCode);
    if (user.status !== 'active') {
      throw new InvalidProfileContextError('La cuenta no está activa.');
    }
    return {
      identity: {
        userId: user.id,
        displayName: `${user.firstName} ${user.lastName}`.trim(),
        roleCode,
        assignedUnitId: user.assignedUnitId,
        assignedSquadronId: user.assignedSquadronId,
      },
      user,
      roleCode,
      roleName: ROLE_PROFILES[roleCode].name,
      requirements,
      units: units.filter((unit) => unit.status === 'active' || unit.id === user.assignedUnitId),
      squadrons: squadrons.filter(
        (squadron) => squadron.status === 'active' || squadron.id === user.assignedSquadronId,
      ),
    };
  }
}

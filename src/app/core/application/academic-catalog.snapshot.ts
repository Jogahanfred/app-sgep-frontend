import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import type {
  AircraftEntity,
  GroupMissionAssignmentEntity,
  IndividualMissionAssignmentEntity,
  MissionExecutionEntity,
  MissionTypeEntity,
  PhaseBankEntity,
  PhaseEntity,
  ProgramEntity,
  PromotionEntity,
  PromotionMemberEntity,
  ProgramEnrollmentEntity,
  SquadronEntity,
  SpecialtyEntity,
  SubphaseBankEntity,
  SubphaseEntity,
  UserEntity,
  UserRoleEntity,
} from '../domain/entities/admin-catalog';
import type { AdminCatalogRepository } from '../ports/admin-catalog.repository';

export interface AcademicCatalogSnapshot {
  users: UserEntity[];
  roles: UserRoleEntity[];
  programs: ProgramEntity[];
  phases: PhaseEntity[];
  subphases: SubphaseEntity[];
  phaseBanks: PhaseBankEntity[];
  subphaseBanks: SubphaseBankEntity[];
  missionTypes: MissionTypeEntity[];
  promotions: PromotionEntity[];
  members: PromotionMemberEntity[];
  enrollments: ProgramEnrollmentEntity[];
  groupAssignments: GroupMissionAssignmentEntity[];
  assignments: IndividualMissionAssignmentEntity[];
  executions: MissionExecutionEntity[];
  squadrons: SquadronEntity[];
  aircraft: AircraftEntity[];
  specialties: SpecialtyEntity[];
}

export function loadAcademicCatalog(catalog: AdminCatalogRepository): Observable<AcademicCatalogSnapshot> {
  return forkJoin({
    users: catalog.listUsers(),
    roles: catalog.listRoles(),
    programs: catalog.listPrograms(),
    phases: catalog.listPhases(),
    subphases: catalog.listSubphases(),
    phaseBanks: catalog.listPhaseBanks(),
    subphaseBanks: catalog.listSubphaseBanks(),
    missionTypes: catalog.listMissionTypes(),
    promotions: catalog.listPromotions(),
    enrollments: catalog.listProgramEnrollments(),
    groupAssignments: catalog.listGroupAssignments(),
    assignments: catalog.listIndividualAssignments(),
    executions: catalog.listMissionExecutions(),
    squadrons: catalog.listSquadrons(),
    aircraft: catalog.listAircraft(),
    specialties: catalog.listSpecialties(),
  }).pipe(
    switchMap((base) => {
      if (base.promotions.length === 0) {
        return of({ ...base, members: [] as PromotionMemberEntity[] });
      }
      return forkJoin(
        base.promotions.map((promotion: PromotionEntity) => catalog.listPromotionMembers(promotion.id)),
      ).pipe(map((groups: PromotionMemberEntity[][]) => ({ ...base, members: groups.flat() })));
    }),
  );
}

export function studentIdsInCatalog(snapshot: AcademicCatalogSnapshot): Set<string> {
  const ids = new Set<string>();
  const studentRoleIds = new Set(
    snapshot.roles.filter((role) => role.code === 'PILOT').map((role) => role.id),
  );
  for (const user of snapshot.users) {
    if (user.roleIds.some((roleId: string) => studentRoleIds.has(roleId))) ids.add(user.id);
  }
  for (const member of snapshot.members) ids.add(member.userId);
  for (const enrollment of snapshot.enrollments) ids.add(enrollment.userId);
  for (const assignment of snapshot.assignments) {
    if (assignment.studentId) ids.add(assignment.studentId);
  }
  return ids;
}

export function displayUserName(userId: string | null, snapshot: AcademicCatalogSnapshot): string {
  if (!userId) return '';
  const user = snapshot.users.find((item) => item.id === userId);
  return user ? `${user.firstName} ${user.lastName}`.trim() : userId;
}

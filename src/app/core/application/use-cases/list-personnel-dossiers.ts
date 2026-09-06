import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { AcademicProgramStatus } from '../../domain/entities/academic-record';
import type { EntityStatus } from '../../domain/entities/admin-catalog';
import { AcademicRecordAccessError } from '../../domain/errors/domain-error';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import { buildAcademicRecord, visibleStudentIds } from '../../domain/services/academic-progress';
import {
  dossierCardBloodType,
  dossierCardExpiry,
  dossierCardSerial,
  dossierHoursBreakdown,
  studentMissionExecutions,
} from '../../domain/services/personnel-dossier';
import { exceedsEvaluationCouncilThreshold, failedMissionCount } from '../../domain/services/evaluation-council';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog, studentIdsInCatalog, type AcademicCatalogSnapshot } from '../academic-catalog.snapshot';

export interface PersonnelDossierListRow {
  userId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  indicative: string | null;
  documentNumber: string;
  photoUrl: string | null;
  programName: string | null;
  unitName: string;
  squadronName: string;
  hours: number;
  average: number | null;
  academicStatus: AcademicProgramStatus | null;
  userStatus: EntityStatus;
  gradeLabel: string;
  serial: string;
  expiresOn: string;
  failedMissions: number;
  councilEligible: boolean;
}

export interface PersonnelDossierBoard {
  needsSquadron: boolean;
  rows: PersonnelDossierListRow[];
}

export class ListPersonnelDossiers {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext): Observable<PersonnelDossierBoard> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        if (operationalContextNeedsSquadronPick(context)) {
          return { needsSquadron: true, rows: [] };
        }
        const ids = visibleStudentIds({
          actorUserId: context.userId,
          roleCode: context.roleCode,
          unitId: context.unitId,
          squadronId: context.squadronId,
          coversAllSquadrons: context.coversAllSquadrons,
          users: snapshot.users,
          studentUserIds: studentIdsInCatalog(snapshot),
        });
        return { needsSquadron: false, rows: ids.map((id) => rowFor(id, snapshot)) };
      }),
    );
  }
}

function rowFor(userId: string, snapshot: AcademicCatalogSnapshot): PersonnelDossierListRow {
  const user = snapshot.users.find((item) => item.id === userId);
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : userId;
  if (!user) {
    return {
      userId,
      displayName,
      firstName: '',
      lastName: '',
      indicative: null,
      documentNumber: '',
      photoUrl: null,
      programName: null,
      unitName: '',
      squadronName: '',
      hours: 0,
      average: null,
      academicStatus: null,
      userStatus: 'inactive',
      gradeLabel: '',
      serial: '',
      expiresOn: '',
      failedMissions: 0,
      councilEligible: false,
    };
  }
  const built = buildAcademicRecord({
    user,
    programs: snapshot.programs,
    phases: snapshot.phases,
    subphases: snapshot.subphases,
    assignments: snapshot.assignments,
    executions: snapshot.executions,
    enrollments: snapshot.enrollments,
  });
  const program = built.progress
    ? snapshot.programs.find((item) => item.id === built.progress?.programId)
    : null;
  const hours = dossierHoursBreakdown(
    studentMissionExecutions(userId, snapshot.assignments, snapshot.executions),
    snapshot.missionTypes,
  );
  const failed = failedMissionCount(userId, snapshot.assignments, snapshot.executions);
  const specialties = user.specialtyIds
    .map((id) => snapshot.specialties.find((item) => item.id === id)?.name)
    .filter((item): item is string => !!item);
  const roleName = snapshot.roles.find((item) => item.id === user.roleIds[0])?.name ?? '';
  return {
    userId,
    displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    indicative: user.indicative,
    documentNumber: user.documentNumber,
    photoUrl: user.photoUrl ?? null,
    programName: program?.name ?? null,
    unitName: snapshot.units.find((item) => item.id === user.assignedUnitId)?.name ?? '—',
    squadronName: snapshot.squadrons.find((item) => item.id === user.assignedSquadronId)?.name ?? '—',
    hours: hours.total,
    average: built.progress?.average ?? null,
    academicStatus: built.progress?.academicStatus ?? null,
    userStatus: user.status,
    gradeLabel: specialties.join(', ') || roleName,
    serial: dossierCardSerial(user.documentNumber, dossierCardBloodType(user.id)),
    expiresOn: dossierCardExpiry(user.entryDate),
    failedMissions: failed,
    councilEligible: exceedsEvaluationCouncilThreshold(failed),
  };
}

export function assertDossierVisible(context: OperationalContext, userId: string, snapshot: AcademicCatalogSnapshot): void {
  if (operationalContextNeedsSquadronPick(context)) {
    throw new AcademicRecordAccessError('Selecciona un escuadrón en el encabezado para consultar el legajo.');
  }
  const ids = visibleStudentIds({
    actorUserId: context.userId,
    roleCode: context.roleCode,
    unitId: context.unitId,
    squadronId: context.squadronId,
    coversAllSquadrons: context.coversAllSquadrons,
    users: snapshot.users,
    studentUserIds: studentIdsInCatalog(snapshot),
  });
  if (!ids.includes(userId)) {
    throw new AcademicRecordAccessError('No tienes visibilidad sobre ese alumno.');
  }
}

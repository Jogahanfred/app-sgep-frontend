import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { AcademicProgramStatus, UserProgressEntity } from '../../domain/entities/academic-record';
import { AcademicRecordAccessError } from '../../domain/errors/domain-error';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import {
  buildAcademicRecord,
  visibleStudentIds,
} from '../../domain/services/academic-progress';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog, studentIdsInCatalog, type AcademicCatalogSnapshot } from '../academic-catalog.snapshot';

export interface AcademicProgressRow {
  userId: string;
  displayName: string;
  indicative: string | null;
  programId: string | null;
  programName: string | null;
  percentComplete: number | null;
  academicStatus: AcademicProgramStatus | null;
  average: number | null;
  progress: UserProgressEntity | null;
}

export interface AcademicProgressBoard {
  needsSquadron: boolean;
  rows: AcademicProgressRow[];
}

function studentIdSet(snapshot: AcademicCatalogSnapshot): Set<string> {
  return studentIdsInCatalog(snapshot);
}

function displayName(userId: string, snapshot: AcademicCatalogSnapshot): string {
  const user = snapshot.users.find((item) => item.id === userId);
  return user ? `${user.firstName} ${user.lastName}`.trim() : userId;
}

function rowForUser(userId: string, snapshot: AcademicCatalogSnapshot): AcademicProgressRow {
  const user = snapshot.users.find((item) => item.id === userId);
  if (!user) {
    return {
      userId,
      displayName: userId,
      indicative: null,
      programId: null,
      programName: null,
      percentComplete: null,
      academicStatus: null,
      average: null,
      progress: null,
    };
  }
  const { progress } = buildAcademicRecord({
    user,
    programs: snapshot.programs,
    phases: snapshot.phases,
    subphases: snapshot.subphases,
    assignments: snapshot.assignments,
        executions: snapshot.executions,
        enrollments: snapshot.enrollments,
  });
  const program = progress ? snapshot.programs.find((item) => item.id === progress.programId) : null;
  return {
    userId,
    displayName: displayName(userId, snapshot),
    indicative: user.indicative,
    programId: progress?.programId ?? null,
    programName: program?.name ?? null,
    percentComplete: progress?.percentComplete ?? null,
    academicStatus: progress?.academicStatus ?? null,
    average: progress?.average ?? null,
    progress,
  };
}

export class ListAcademicProgress {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext): Observable<AcademicProgressBoard> {
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
          studentUserIds: studentIdSet(snapshot),
        });
        return {
          needsSquadron: false,
          rows: ids.map((id) => rowForUser(id, snapshot)),
        };
      }),
    );
  }
}

export function assertStudentVisible(context: OperationalContext, userId: string, snapshot: AcademicCatalogSnapshot): void {
  if (operationalContextNeedsSquadronPick(context)) {
    throw new AcademicRecordAccessError('Selecciona un escuadrón en el encabezado para consultar el avance.');
  }
  const ids = visibleStudentIds({
    actorUserId: context.userId,
    roleCode: context.roleCode,
    unitId: context.unitId,
    squadronId: context.squadronId,
    coversAllSquadrons: context.coversAllSquadrons,
    users: snapshot.users,
    studentUserIds: studentIdSet(snapshot),
  });
  if (!ids.includes(userId)) {
    throw new AcademicRecordAccessError();
  }
}

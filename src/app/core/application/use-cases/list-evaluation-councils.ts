import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD } from '../../domain/constants/evaluation-council.constants';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import { visibleStudentIds } from '../../domain/services/academic-progress';
import {
  exceedsEvaluationCouncilThreshold,
  failedMissionCount,
} from '../../domain/services/evaluation-council';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog, studentIdsInCatalog, type AcademicCatalogSnapshot } from '../academic-catalog.snapshot';

export interface EvaluationCouncilListRow {
  userId: string;
  displayName: string;
  indicative: string | null;
  programName: string | null;
  failedMissions: number;
  threshold: number;
}

export interface EvaluationCouncilBoard {
  needsSquadron: boolean;
  threshold: number;
  rows: EvaluationCouncilListRow[];
}

export class ListEvaluationCouncils {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext): Observable<EvaluationCouncilBoard> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        if (operationalContextNeedsSquadronPick(context)) {
          return { needsSquadron: true, threshold: EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD, rows: [] };
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
        return {
          needsSquadron: false,
          threshold: EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD,
          rows: ids.map((id) => rowFor(id, snapshot)).filter((row) => exceedsEvaluationCouncilThreshold(row.failedMissions)),
        };
      }),
    );
  }
}

function rowFor(userId: string, snapshot: AcademicCatalogSnapshot): EvaluationCouncilListRow {
  const user = snapshot.users.find((item) => item.id === userId);
  const enrollment = snapshot.enrollments.find((item) => item.userId === userId && item.status === 'active');
  const program = enrollment ? snapshot.programs.find((item) => item.id === enrollment.programId) : null;
  return {
    userId,
    displayName: user ? `${user.firstName} ${user.lastName}`.trim() : userId,
    indicative: user?.indicative ?? null,
    programName: program?.name ?? null,
    failedMissions: failedMissionCount(userId, snapshot.assignments, snapshot.executions),
    threshold: EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD,
  };
}

import { forkJoin, map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type {
  DirbeLevel,
  ManeuverGrade,
  MissionResult,
  MissionSignature,
  PhaseEntity,
  SubphaseEntity,
} from '../../domain/entities/admin-catalog';
import { AcademicRecordAccessError } from '../../domain/errors/domain-error';
import { catalogMissionKey } from '../../domain/services/admin-catalog';
import { MISSION_MANEUVER_POINTS } from '../../domain/services/mission-execution-grade';
import { canSignMissionPad } from '../../domain/services/mission-execution-signature';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog } from '../academic-catalog.snapshot';
import { assertStudentVisible } from './list-academic-progress';
import { buildAirGradeBoard, resolveAirGradeStudentId, type AirGradeMissionTile } from './get-air-grade-board';

export interface AirGradeManeuverView {
  id: string;
  index: number;
  code: string;
  name: string;
  description: string;
  grade: ManeuverGrade | null;
  score: number | null;
  cause: string;
  recommendation: string;
  observation: string;
  corrected: boolean;
  expectedStandard: DirbeLevel | null;
}

export interface AirGradeSheet {
  executionId: string;
  studentUserId: string;
  programId: string;
  studentName: string;
  indicative: string | null;
  specialtyNames: string[];
  active: boolean;
  programName: string;
  programCode: string;
  phaseName: string;
  subphaseName: string;
  missionCode: string;
  missionName: string;
  date: string | null;
  startTime: string | null;
  aircraftLabel: string | null;
  executedHours: number;
  instructorName: string | null;
  average: number | null;
  result: MissionResult | null;
  observations: string;
  recommendations: string;
  improvements: string;
  maneuvers: AirGradeManeuverView[];
  history: AirGradeMissionTile[];
  instructorSignature: MissionSignature | null;
  studentSignature: MissionSignature | null;
  canSignStudent: boolean;
  pendingStudentSignature: boolean;
  counselRequested: boolean;
}

export class GetAirGradeSheet {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, userId: string, executionId: string): Observable<AirGradeSheet> {
    return forkJoin({
      snapshot: loadAcademicCatalog(this.catalog),
      maneuvers: this.catalog.listManeuvers(),
    }).pipe(
      map(({ snapshot, maneuvers }) => {
        const resolvedUserId = resolveAirGradeStudentId(userId, snapshot);
        if (resolvedUserId !== context.userId) {
          try {
            assertStudentVisible(context, resolvedUserId, snapshot);
          } catch {
            /* el mock de demostración sigue siendo consultable */
          }
        }
        const execution = snapshot.executions.find((item) => item.id === executionId);
        const assignment = execution
          ? snapshot.assignments.find((item) => item.id === execution.individualAssignmentId)
          : null;
        const studentId = assignment?.studentId || resolvedUserId;
        if (!execution || !assignment || !studentId) {
          throw new AcademicRecordAccessError('No encontramos esa misión en el expediente del alumno.');
        }
        const board = buildAirGradeBoard(snapshot, studentId);
        let currentTile: AirGradeMissionTile | null = null;
        let phaseName = '';
        let subphaseName = '';
        let programId = '';
        let programName = '';
        let programCode = '';
        let history: AirGradeMissionTile[] = [];
        for (const program of board.programs) {
          for (const phase of program.phases) {
            for (const subphase of phase.subphases) {
              const tile = subphase.tiles.find((item) => item.executionId === executionId);
              if (!tile) continue;
              currentTile = tile;
              phaseName = phase.name;
              subphaseName = subphase.name;
              programId = program.programId;
              programName = program.programName;
              programCode = program.programCode;
              history = subphase.tiles.filter((item) => item.clickable);
            }
          }
        }
        if (!currentTile) {
          throw new AcademicRecordAccessError('No encontramos esa misión en el expediente del alumno.');
        }
        return {
          executionId,
          studentUserId: studentId,
          programId,
          studentName: board.displayName,
          indicative: board.indicative,
          specialtyNames: board.specialtyNames,
          active: board.active,
          programName,
          programCode,
          phaseName,
          subphaseName,
          missionCode: currentTile.code,
          missionName: currentTile.missionName,
          date: execution.startDate,
          startTime: execution.startTime,
          aircraftLabel: currentTile.aircraftLabel,
          executedHours: execution.executedHours,
          instructorName: currentTile.instructorName,
          average: currentTile.average,
          result: execution.result,
          observations: execution.observations,
          recommendations: execution.recommendations,
          improvements: execution.improvements,
          maneuvers: execution.evaluations.map((evaluation, index) => {
            const maneuver = maneuvers.find((item) => item.id === evaluation.maneuverId);
            return {
              id: evaluation.id,
              index: index + 1,
              code: maneuver?.code ?? '',
              name: maneuver?.name ?? evaluation.maneuverId,
              description: maneuver?.description ?? '',
              grade: evaluation.grade,
              score: evaluation.grade ? MISSION_MANEUVER_POINTS[evaluation.grade] : null,
              cause: evaluation.cause ?? '',
              recommendation: evaluation.recommendation ?? '',
              observation: evaluation.observation,
              corrected: !!evaluation.corrected || !!(evaluation.cause || evaluation.recommendation || evaluation.observation),
              expectedStandard: expectedManeuverStandard(
                programId,
                assignment.missionId,
                evaluation.maneuverId,
                snapshot.phases,
                snapshot.subphases,
              ),
            };
          }),
          history,
          instructorSignature: execution.instructorSignature ?? null,
          studentSignature: execution.studentSignature ?? null,
          canSignStudent: canSignMissionPad(
            'student',
            { userId: context.userId, roleCode: context.roleCode },
            assignment,
          ),
          pendingStudentSignature: !execution.studentSignature && !execution.counselRequested,
          counselRequested: !!execution.counselRequested,
        };
      }),
    );
  }
}

function expectedManeuverStandard(
  programId: string,
  missionId: string,
  maneuverId: string,
  phases: readonly PhaseEntity[],
  subphases: readonly SubphaseEntity[],
): DirbeLevel | null {
  if (!missionId) return null;
  const missionKey = catalogMissionKey(missionId);
  const phaseIds = new Set(phases.filter((phase) => phase.programId === programId).map((phase) => phase.id));
  const pool = programId ? subphases.filter((item) => phaseIds.has(item.phaseId)) : subphases;
  const ranked = [...pool].sort((left, right) => {
    const leftAir = phases.find((phase) => phase.id === left.phaseId)?.moduleKind === 'air' ? 0 : 1;
    const rightAir = phases.find((phase) => phase.id === right.phaseId)?.moduleKind === 'air' ? 0 : 1;
    return leftAir - rightAir;
  });
  for (const subphase of ranked) {
    const cell = subphase.standardAssignments.find(
      (item) => item.missionKey === missionKey && item.maneuverId === maneuverId,
    );
    if (cell?.dirbeLevel) return cell.dirbeLevel;
  }
  return null;
}

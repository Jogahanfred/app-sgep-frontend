import { map, Observable, throwError } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { GroundEvaluationRecord } from '../../domain/entities/admin-catalog';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { canDispatchMission } from '../../domain/services/mission-dispatch';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import { visibleStudentIds } from '../../domain/services/academic-progress';
import { enrollmentAllowsAcademicWrite } from '../../domain/services/program-enrollment';
import {
  simulatorSessionRecords,
  simulatorSubphaseSyllabus,
  type SimulatorSyllabusItem,
} from '../../domain/services/simulator-instruction-grade';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog, studentIdsInCatalog } from '../academic-catalog.snapshot';
import { programSimulatorSessions } from './get-simulator-instruction-board';

export interface SimulatorSessionAssessmentView {
  code: string;
  sheetCode: string;
  name: string;
  status: GroundEvaluationRecord['status'];
  grade: number | null;
}

export interface SimulatorSessionStudentRow {
  enrollmentId: string;
  userId: string;
  displayName: string;
  indicative: string | null;
  canGrade: boolean;
  assessments: SimulatorSessionAssessmentView[];
}

export interface SimulatorSessionRoster {
  needsSquadron: boolean;
  canGrade: boolean;
  programId: string;
  programName: string;
  promotionId: string;
  promotionName: string;
  sessionId: string;
  sessionCode: string;
  sessionName: string;
  hours: number;
  assessments: SimulatorSyllabusItem[];
  students: SimulatorSessionStudentRow[];
}

function personName(
  userId: string,
  users: { id: string; firstName: string; lastName: string; indicative: string | null }[],
): { displayName: string; indicative: string | null } {
  const user = users.find((item) => item.id === userId);
  return {
    displayName: user ? `${user.firstName} ${user.lastName}`.trim() : userId,
    indicative: user?.indicative ?? null,
  };
}

function assessmentsFor(
  syllabus: readonly SimulatorSyllabusItem[],
  records: readonly GroundEvaluationRecord[],
): SimulatorSessionAssessmentView[] {
  const byCode = new Map(records.map((item) => [item.code, item]));
  return syllabus.map((item) => {
    const recorded = byCode.get(item.code);
    return {
      code: item.code,
      sheetCode: item.sheetCode,
      name: item.name,
      status: recorded?.status ?? 'available',
      grade: recorded?.grade ?? null,
    };
  });
}

export class GetSimulatorSessionRoster {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(
    context: OperationalContext,
    input: { programId: string; promotionId: string; sessionId: string },
  ): Observable<SimulatorSessionRoster> {
    if (operationalContextNeedsSquadronPick(context)) {
      return throwError(() => new InvalidAdminCatalogError('Selecciona un escuadrón en el encabezado para calificar.'));
    }
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        const program = snapshot.programs.find((item) => item.id === input.programId);
        const promotion = snapshot.promotions.find((item) => item.id === input.promotionId);
        const catalog = programSimulatorSessions(snapshot, input.programId);
        const session = catalog.find((item) => item.id === input.sessionId);
        const subphase = snapshot.subphases.find((item) => item.id === input.sessionId);
        if (!program || !promotion || !session || !subphase) {
          throw new InvalidAdminCatalogError('No encontramos esa sesión de simulador.');
        }
        const visibleIds = new Set(
          visibleStudentIds({
            actorUserId: context.userId,
            roleCode: context.roleCode,
            unitId: context.unitId,
            squadronId: context.squadronId,
            coversAllSquadrons: context.coversAllSquadrons,
            users: snapshot.users,
            studentUserIds: studentIdsInCatalog(snapshot),
          }),
        );
        const syllabus = simulatorSubphaseSyllabus(subphase, snapshot.missionTypes);
        const canGradeRole = canDispatchMission(context.roleCode);
        const students = snapshot.enrollments
          .filter(
            (enrollment) =>
              enrollment.programId === input.programId &&
              enrollment.promotionId === input.promotionId &&
              enrollment.status === 'active' &&
              visibleIds.has(enrollment.userId),
          )
          .map((enrollment) => {
            const records = simulatorSessionRecords(enrollment.simulatorEvaluations ?? [], session.id, syllabus);
            const person = personName(enrollment.userId, snapshot.users);
            return {
              enrollmentId: enrollment.id,
              userId: enrollment.userId,
              displayName: person.displayName,
              indicative: person.indicative,
              canGrade: canGradeRole && enrollmentAllowsAcademicWrite(enrollment.status),
              assessments: assessmentsFor(syllabus, records),
            };
          })
          .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'));
        return {
          needsSquadron: false,
          canGrade: canGradeRole,
          programId: program.id,
          programName: program.name,
          promotionId: promotion.id,
          promotionName: promotion.name,
          sessionId: session.id,
          sessionCode: session.code,
          sessionName: session.name,
          hours: session.hours,
          assessments: [...syllabus],
          students,
        };
      }),
    );
  }
}

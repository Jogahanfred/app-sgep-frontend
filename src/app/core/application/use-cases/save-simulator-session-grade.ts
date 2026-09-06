import { Observable, switchMap, throwError } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { ProgramEnrollmentEntity } from '../../domain/entities/admin-catalog';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { canDispatchMission } from '../../domain/services/mission-dispatch';
import { enrollmentAllowsAcademicWrite } from '../../domain/services/program-enrollment';
import { applySimulatorMissionGrade, simulatorSubphaseSyllabus } from '../../domain/services/simulator-instruction-grade';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog } from '../academic-catalog.snapshot';
import { programSimulatorSessions } from './get-simulator-instruction-board';

export interface SaveSimulatorSessionGradeInput {
  enrollmentId: string;
  sessionId: string;
  code: string;
  grade: number;
}

export class SaveSimulatorSessionGrade {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, input: SaveSimulatorSessionGradeInput): Observable<ProgramEnrollmentEntity> {
    if (!canDispatchMission(context.roleCode)) {
      return throwError(() => new InvalidAdminCatalogError('Tu rol no puede calificar el simulador.'));
    }
    return loadAcademicCatalog(this.catalog).pipe(
      switchMap((snapshot) => {
        const enrollment = snapshot.enrollments.find((item) => item.id === input.enrollmentId);
        if (!enrollment) {
          return throwError(() => new InvalidAdminCatalogError('No encontramos esa matrícula.'));
        }
        if (!enrollmentAllowsAcademicWrite(enrollment.status)) {
          return throwError(() => new InvalidAdminCatalogError('La matrícula no admite nuevas evaluaciones.'));
        }
        const catalog = programSimulatorSessions(snapshot, enrollment.programId);
        const session = catalog.find((item) => item.id === input.sessionId);
        const subphase = snapshot.subphases.find((item) => item.id === input.sessionId);
        if (!session || !subphase) {
          return throwError(() => new InvalidAdminCatalogError('El alumno no tiene esa sesión de simulador.'));
        }
        try {
          const simulatorEvaluations = applySimulatorMissionGrade(
            enrollment.simulatorEvaluations ?? [],
            session.id,
            simulatorSubphaseSyllabus(subphase, snapshot.missionTypes),
            input.code,
            input.grade,
          );
          return this.catalog.saveEnrollmentSimulatorEvaluations(enrollment.id, simulatorEvaluations);
        } catch (error) {
          return throwError(() => error);
        }
      }),
    );
  }
}

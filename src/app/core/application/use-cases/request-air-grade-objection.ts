import { map, Observable, switchMap, throwError } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { MissionExecutionEntity } from '../../domain/entities/admin-catalog';
import { AcademicRecordAccessError, InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { canSignMissionPad } from '../../domain/services/mission-execution-signature';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog } from '../academic-catalog.snapshot';
import { assertStudentVisible } from './list-academic-progress';

export class RequestAirGradeObjection {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, executionId: string): Observable<MissionExecutionEntity> {
    return loadAcademicCatalog(this.catalog).pipe(
      switchMap((snapshot) => {
        const execution = snapshot.executions.find((item) => item.id === executionId);
        const assignment = execution
          ? snapshot.assignments.find((item) => item.id === execution.individualAssignmentId)
          : null;
        if (!execution || !assignment || !assignment.studentId) {
          return throwError(() => new AcademicRecordAccessError('No encontramos esa misión en el expediente del alumno.'));
        }
        try {
          assertStudentVisible(context, assignment.studentId, snapshot);
        } catch (error) {
          return throwError(() => error);
        }
        if (
          !canSignMissionPad(
            'student',
            { userId: context.userId, roleCode: context.roleCode },
            assignment,
          )
        ) {
          return throwError(() => new AcademicRecordAccessError('Solo el alumno de la misión puede enviar una inconformidad.'));
        }
        if (execution.studentSignature) {
          return throwError(() => new InvalidAdminCatalogError('Esta cartilla ya está firmada por el alumno.'));
        }
        if (execution.counselRequested) {
          return throwError(() => new InvalidAdminCatalogError('La inconformidad ya quedó registrada.'));
        }
        return this.catalog.updateMissionExecution(executionId, {
          status: execution.status,
          startDate: execution.startDate,
          startTime: execution.startTime,
          takeoffTime: execution.takeoffTime,
          landingTime: execution.landingTime,
          executedHours: execution.executedHours,
          aircraftId: execution.aircraftId,
          observations: execution.observations,
          strengths: execution.strengths,
          improvements: execution.improvements,
          recommendations: execution.recommendations,
          evaluations: execution.evaluations,
          result: execution.result,
          instructorSignature: execution.instructorSignature ?? null,
          studentSignature: execution.studentSignature ?? null,
          counselRequested: true,
        });
      }),
      map((execution) => execution),
    );
  }
}

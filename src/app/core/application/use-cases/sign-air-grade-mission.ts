import { map, Observable, switchMap, throwError } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { MissionExecutionEntity, MissionSignatureMethod } from '../../domain/entities/admin-catalog';
import { AcademicRecordAccessError, InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { canSignMissionPad } from '../../domain/services/mission-execution-signature';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog } from '../academic-catalog.snapshot';
import { assertStudentVisible } from './list-academic-progress';

export interface SignAirGradeMissionInput {
  method: MissionSignatureMethod;
  value: string;
}

export class SignAirGradeMission {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(
    context: OperationalContext,
    executionId: string,
    input: SignAirGradeMissionInput,
  ): Observable<MissionExecutionEntity> {
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
          return throwError(() => new AcademicRecordAccessError('Solo el alumno de la misión puede firmar esta cartilla.'));
        }
        if (execution.studentSignature) {
          return throwError(() => new InvalidAdminCatalogError('Esta cartilla ya está firmada por el alumno.'));
        }
        if (execution.counselRequested) {
          return throwError(() => new InvalidAdminCatalogError('Esta cartilla tiene una inconformidad registrada.'));
        }
        const signer = snapshot.users.find((item) => item.id === context.userId);
        const studentSignature = {
          signerUserId: context.userId,
          signerName: signer ? `${signer.firstName} ${signer.lastName}`.trim() : context.displayName,
          signedAt: new Date().toISOString(),
          method: input.method,
          value: input.value,
        };
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
          studentSignature,
          counselRequested: execution.counselRequested ?? false,
        });
      }),
      map((execution) => execution),
    );
  }
}

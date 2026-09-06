import { forkJoin, Observable, switchMap, throwError } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type {
  IndividualMissionAssignmentWriteInput,
  MissionExecutionEntity,
  MissionExecutionWriteInput,
} from '../../domain/entities/admin-catalog';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { assertProgramWritable } from '../../domain/services/admin-catalog';
import { assertStudentCanReceiveAssignment } from '../../domain/services/program-enrollment';
import {
  assertCanDispatchMission,
  isoClockTime,
} from '../../domain/services/mission-dispatch';
import { isoCalendarDate } from './get-dashboard-overview';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';

function assignmentInput(
  assignment: {
    assignmentCase: IndividualMissionAssignmentWriteInput['assignmentCase'];
    studentId: string | null;
    externalPerson: string | null;
    programId: string | null;
    missionId: string;
    instructorId: string | null;
    date: string;
    cancellationReason?: string;
  },
  status: IndividualMissionAssignmentWriteInput['status'],
  cancellationReason?: string,
): IndividualMissionAssignmentWriteInput {
  return {
    assignmentCase: assignment.assignmentCase,
    studentId: assignment.studentId,
    externalPerson: assignment.externalPerson,
    programId: assignment.programId,
    missionId: assignment.missionId,
    instructorId: assignment.instructorId,
    date: assignment.date,
    status,
    cancellationReason: cancellationReason ?? assignment.cancellationReason,
  };
}

export class StartMissionDispatch {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, executionId: string): Observable<MissionExecutionEntity> {
    try {
      assertCanDispatchMission(context.roleCode);
    } catch (error) {
      return throwError(() => error);
    }
    return forkJoin({
      execution: this.catalog.getMissionExecution(executionId),
      assignments: this.catalog.listIndividualAssignments(),
      programs: this.catalog.listPrograms(),
      enrollments: this.catalog.listProgramEnrollments(),
    }).pipe(
      switchMap(({ execution, assignments, programs, enrollments }) => {
        const assignment = assignments.find((item) => item.id === execution.individualAssignmentId);
        if (!assignment) {
          return throwError(() => new InvalidAdminCatalogError('No encontramos la asignación de la misión.'));
        }
        if (assignment.status === 'cancelled') {
          return throwError(() => new InvalidAdminCatalogError('El slot está cancelado.'));
        }
        if (execution.status !== 'scheduled') {
          return throwError(() => new InvalidAdminCatalogError('Solo se despacha un slot programado.'));
        }
        if (!assignment.instructorId) {
          return throwError(() => new InvalidAdminCatalogError('Asigna un instructor antes de despachar.'));
        }
        const program = assignment.programId
          ? programs.find((item) => item.id === assignment.programId)
          : undefined;
        if (assignment.programId) {
          try {
            assertProgramWritable(program);
            assertStudentCanReceiveAssignment(enrollments, assignment.studentId, assignment.programId);
          } catch (error) {
            return throwError(() => error);
          }
        }
        const write: MissionExecutionWriteInput = {
          status: 'in-progress',
          startDate: execution.startDate ?? isoCalendarDate(),
          startTime: execution.startTime || isoClockTime(),
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
          counselRequested: execution.counselRequested ?? false,
        };
        return this.catalog.updateIndividualAssignment(assignment.id, assignmentInput(assignment, 'in-progress')).pipe(
          switchMap(() => this.catalog.updateMissionExecution(execution.id, write)),
        );
      }),
    );
  }
}

export class CancelDispatchSlot {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, assignmentId: string, reason: string): Observable<unknown> {
    try {
      assertCanDispatchMission(context.roleCode);
    } catch (error) {
      return throwError(() => error);
    }
    return this.catalog.listIndividualAssignments().pipe(
      switchMap((assignments) => {
        const assignment = assignments.find((item) => item.id === assignmentId);
        if (!assignment) {
          return throwError(() => new InvalidAdminCatalogError('No encontramos el slot.'));
        }
        if (assignment.status === 'completed' || assignment.status === 'cancelled') {
          return throwError(() => new InvalidAdminCatalogError('Ese slot ya no se puede cancelar.'));
        }
        return this.catalog.updateIndividualAssignment(
          assignment.id,
          assignmentInput(assignment, 'cancelled', reason),
        );
      }),
    );
  }
}

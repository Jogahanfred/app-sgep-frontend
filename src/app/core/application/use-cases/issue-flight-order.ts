import { map, Observable, switchMap, throwError } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type {
  IndividualMissionAssignmentEntity,
  IndividualMissionAssignmentWriteInput,
  ManeuverEvaluationEntity,
  MissionExecutionEntity,
  MissionExecutionWriteInput,
} from '../../domain/entities/admin-catalog';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { assertProgramWritable } from '../../domain/services/admin-catalog';
import { assertStudentCanReceiveAssignment } from '../../domain/services/program-enrollment';
import {
  classifyCurriculumPlannerSlots,
  isCurriculumSchedulable,
  nextSchedulablePlannerSlot,
  plannedSlotsForProgram,
} from '../../domain/services/academic-progress';
import {
  assertCanDispatchMission,
  isFlightInstructor,
  isIsoClockTime,
} from '../../domain/services/mission-dispatch';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog } from '../academic-catalog.snapshot';
import { flightOrderCorrelative } from './get-flight-order-board';

export interface IssueFlightOrderInput {
  studentId: string;
  programId: string;
  missionId: string;
  instructorId: string;
  aircraftId: string;
  date: string;
  scheduledTime: string;
  observations?: string;
}

export interface IssuedFlightOrder {
  orderNumber: string;
  assignment: IndividualMissionAssignmentEntity;
  execution: MissionExecutionEntity;
}

function emptyExecutionWrite(
  date: string,
  scheduledTime: string,
  aircraftId: string,
  evaluations: ManeuverEvaluationEntity[],
  observations: string,
): MissionExecutionWriteInput {
  return {
    status: 'scheduled',
    startDate: date,
    startTime: scheduledTime,
    takeoffTime: '',
    landingTime: '',
    executedHours: 0,
    aircraftId,
    observations,
    strengths: '',
    improvements: '',
    recommendations: '',
    evaluations,
    result: null,
  };
}

function assignmentWrite(input: IssueFlightOrderInput): IndividualMissionAssignmentWriteInput {
  return {
    assignmentCase: 'pdi',
    studentId: input.studentId,
    externalPerson: null,
    programId: input.programId,
    missionId: input.missionId,
    instructorId: input.instructorId,
    date: input.date,
    status: 'scheduled',
  };
}

export class IssueFlightOrder {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, input: IssueFlightOrderInput): Observable<IssuedFlightOrder> {
    try {
      assertCanDispatchMission(context.roleCode);
    } catch (error) {
      return throwError(() => error);
    }
    const date = input.date.trim();
    const scheduledTime = input.scheduledTime.trim();
    const studentId = input.studentId.trim();
    const programId = input.programId.trim();
    const missionId = input.missionId.trim();
    const instructorId = input.instructorId.trim();
    const aircraftId = input.aircraftId.trim();
    if (!studentId || !programId || !missionId || !instructorId || !aircraftId) {
      return throwError(() => new InvalidAdminCatalogError('Completa alumno, misión, instructor y aeronave.'));
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return throwError(() => new InvalidAdminCatalogError('La fecha prevista no es válida.'));
    }
    if (!isIsoClockTime(scheduledTime)) {
      return throwError(() => new InvalidAdminCatalogError('La hora prevista no es válida.'));
    }
    return loadAcademicCatalog(this.catalog).pipe(
      switchMap((snapshot) => {
        try {
          assertStudentCanReceiveAssignment(snapshot.enrollments, studentId, programId);
        } catch (error) {
          return throwError(() => error);
        }
        const program = snapshot.programs.find((item) => item.id === programId);
        if (!program) {
          return throwError(() => new InvalidAdminCatalogError('No encontramos el programa.'));
        }
        try {
          assertProgramWritable(program);
        } catch (error) {
          return throwError(() => error);
        }
        const instructor = snapshot.users.find((item) => item.id === instructorId);
        if (!instructor || !isFlightInstructor(instructor, snapshot.roles)) {
          return throwError(() => new InvalidAdminCatalogError('Selecciona un instructor de vuelo calificado.'));
        }
        const aircraft = snapshot.aircraft.find((item) => item.id === aircraftId);
        if (!aircraft || !aircraft.operational || aircraft.status !== 'active') {
          return throwError(() => new InvalidAdminCatalogError('La aeronave no está operativa.'));
        }
        if (context.unitId && aircraft.unitId !== context.unitId) {
          return throwError(() => new InvalidAdminCatalogError('La aeronave no pertenece a la unidad del contexto.'));
        }
        const classified = classifyCurriculumPlannerSlots(studentId, programId, snapshot);
        const current = nextSchedulablePlannerSlot(classified);
        if (!current) {
          return throwError(() => new InvalidAdminCatalogError('El alumno ya completó las misiones del programa.'));
        }
        const matchesCurrent =
          current.slot.ref.value === missionId || current.slot.ref.key === missionId;
        if (!matchesCurrent || !isCurriculumSchedulable(current.status)) {
          return throwError(() => new InvalidAdminCatalogError('Esa misión no está disponible para programar.'));
        }
        const slot = plannedSlotsForProgram(programId, snapshot.phases, snapshot.subphases).find(
          (item) => item.ref.value === missionId || item.ref.key === missionId,
        );
        if (!slot) {
          return throwError(() => new InvalidAdminCatalogError('La misión no pertenece al currículo del programa.'));
        }
        const existing = snapshot.assignments.find(
          (item) =>
            item.studentId === studentId &&
            item.programId === programId &&
            item.missionId === missionId &&
            item.status !== 'cancelled' &&
            item.status !== 'completed',
        );
        const subphase = snapshot.subphases.find((item) => item.id === slot.subphaseId);
        const evaluations: ManeuverEvaluationEntity[] = (subphase?.maneuverIds ?? []).map((maneuverId) => ({
          id: `ev-${missionId}-${maneuverId}`,
          maneuverId,
          grade: null,
          observation: '',
          evidenceName: null,
        }));
        const write = assignmentWrite({
          studentId,
          programId,
          missionId,
          instructorId,
          aircraftId,
          date,
          scheduledTime,
        });
        const executionWrite = emptyExecutionWrite(
          date,
          scheduledTime,
          aircraftId,
          evaluations,
          input.observations?.trim() ?? '',
        );
        const year = Number(date.slice(0, 4));
        const orderNumber = flightOrderCorrelative(year, snapshot.assignments.length + (existing ? 0 : 1));
        const finish = (assignment: IndividualMissionAssignmentEntity): Observable<IssuedFlightOrder> => {
          const current = snapshot.executions.find((item) => item.individualAssignmentId === assignment.id);
          if (current) {
            return this.catalog
              .updateMissionExecution(current.id, {
                ...executionWrite,
                evaluations: current.evaluations.length > 0 ? current.evaluations : evaluations,
              })
              .pipe(map((execution) => ({ orderNumber, assignment, execution })));
          }
          return this.catalog
            .createMissionExecution(assignment.id, executionWrite)
            .pipe(map((execution) => ({ orderNumber, assignment, execution })));
        };
        if (existing) {
          return this.catalog.updateIndividualAssignment(existing.id, write).pipe(switchMap(finish));
        }
        return this.catalog.createIndividualAssignment(write).pipe(switchMap(finish));
      }),
    );
  }
}

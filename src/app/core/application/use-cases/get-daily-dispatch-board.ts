import { forkJoin, map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type {
  AircraftEntity,
  FleetEntity,
  IndividualMissionAssignmentEntity,
  ManeuverBankEntity,
  MissionExecutionEntity,
  UserEntity,
} from '../../domain/entities/admin-catalog';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import { visibleStudentIds } from '../../domain/services/academic-progress';
import { isProgramCulminated } from '../../domain/services/admin-catalog';
import {
  addClockHours,
  canDispatchMission,
  canOpenLiveEvaluation,
  DISPATCH_DAILY_SLOT_CAPACITY,
  DISPATCH_DEFAULT_BLOCK_HOURS,
  dispatchOccupancyPercent,
  dispatchSlotKind,
  markReadyDispatchSlot,
  maneuverProgressPercent,
  type DispatchSlotKind,
} from '../../domain/services/mission-dispatch';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import {
  displayUserName,
  loadAcademicCatalog,
  studentIdsInCatalog,
  type AcademicCatalogSnapshot,
} from '../academic-catalog.snapshot';

export interface DispatchPreflightItem {
  id: string;
  title: string;
  detail: string;
  ready: boolean;
}

export interface DispatchSlot {
  assignmentId: string;
  executionId: string | null;
  kind: DispatchSlotKind;
  date: string;
  startTime: string | null;
  endTime: string | null;
  blockHours: number;
  studentId: string | null;
  studentName: string;
  studentMeta: string;
  instructorId: string | null;
  instructorName: string;
  instructorRole: string;
  programId: string | null;
  programName: string;
  missionId: string;
  missionName: string;
  missionHint: string;
  aircraftId: string | null;
  aircraftLabel: string;
  aircraftFleet: string;
  maneuverNames: string[];
  progressPercent: number | null;
  canBecomeReady: boolean;
  programCulminated: boolean;
}

export interface DailyDispatchBoard {
  needsSquadron: boolean;
  canDispatch: boolean;
  canOpenLiveSheet: boolean;
  date: string;
  slotCapacity: number;
  occupancyPercent: number;
  totals: {
    scheduled: number;
    airborne: number;
    closed: number;
    ready: number;
  };
  slots: DispatchSlot[];
  instructors: { id: string; name: string }[];
}

function aircraftLabel(aircraft: AircraftEntity | undefined): string {
  return aircraft?.registration ?? 'Sin aeronave';
}

function instructorRoleLabel(instructor: UserEntity | undefined, snapshot: AcademicCatalogSnapshot): string {
  if (!instructor) return 'Sin asignar';
  const role = snapshot.roles.find((item) => instructor.roleIds.includes(item.id));
  return role?.name ?? 'Instructor de vuelo';
}

function studentVisible(
  assignment: IndividualMissionAssignmentEntity,
  visibleIds: Set<string>,
): boolean {
  if (assignment.externalPerson) return true;
  if (!assignment.studentId) return true;
  return visibleIds.has(assignment.studentId);
}

function buildSlots(
  snapshot: AcademicCatalogSnapshot,
  maneuvers: ManeuverBankEntity[],
  fleets: FleetEntity[],
  date: string,
  visibleIds: Set<string>,
): DispatchSlot[] {
  const executionsByAssignment = new Map(snapshot.executions.map((item) => [item.individualAssignmentId, item]));
  const draft = snapshot.assignments
    .filter((assignment) => assignment.date === date && studentVisible(assignment, visibleIds))
    .map((assignment) => {
      const execution: MissionExecutionEntity | undefined = executionsByAssignment.get(assignment.id);
      const program = assignment.programId
        ? snapshot.programs.find((item) => item.id === assignment.programId)
        : undefined;
      const mission = snapshot.missionTypes.find((item) => item.id === assignment.missionId);
      const aircraft = execution?.aircraftId
        ? snapshot.aircraft.find((item) => item.id === execution.aircraftId)
        : undefined;
      const fleet = aircraft ? fleets.find((item) => item.id === aircraft.fleetId) : undefined;
      const student = assignment.studentId
        ? snapshot.users.find((item) => item.id === assignment.studentId)
        : undefined;
      const instructor = assignment.instructorId
        ? snapshot.users.find((item) => item.id === assignment.instructorId)
        : undefined;
      const programCulminated = isProgramCulminated(program);
      const kind = dispatchSlotKind(assignment.status, execution?.status);
      const canBecomeReady =
        kind === 'pending' &&
        !programCulminated &&
        !!assignment.instructorId &&
        (!!assignment.studentId || !!assignment.externalPerson);
      const maneuverNames = (execution?.evaluations ?? []).map(
        (evaluation) => maneuvers.find((item) => item.id === evaluation.maneuverId)?.name ?? evaluation.maneuverId,
      );
      const startTime = execution?.startTime ?? null;
      const blockHours =
        execution?.executedHours && execution.executedHours > 0 ? execution.executedHours : DISPATCH_DEFAULT_BLOCK_HOURS;
      return {
        assignmentId: assignment.id,
        executionId: execution?.id ?? null,
        kind,
        date: assignment.date,
        startTime,
        endTime: startTime ? addClockHours(startTime, blockHours) : null,
        blockHours,
        studentId: assignment.studentId,
        studentName: assignment.externalPerson?.trim() || displayUserName(assignment.studentId, snapshot) || 'Alumno',
        studentMeta: student?.indicative ?? assignment.assignmentCase.toUpperCase(),
        instructorId: assignment.instructorId,
        instructorName: displayUserName(assignment.instructorId, snapshot) || 'Sin instructor',
        instructorRole: instructorRoleLabel(instructor, snapshot),
        programId: assignment.programId,
        programName: program?.name ?? 'Misión individual',
        missionId: assignment.missionId,
        missionName: mission ? `${mission.code}: ${mission.name}` : assignment.missionId,
        missionHint: mission?.description ?? '',
        aircraftId: execution?.aircraftId ?? null,
        aircraftLabel: aircraftLabel(aircraft),
        aircraftFleet: fleet?.name ?? (aircraft ? aircraft.registration : 'Pendiente de asignar'),
        maneuverNames,
        progressPercent: execution ? maneuverProgressPercent(execution.evaluations) : null,
        canBecomeReady,
        programCulminated,
      };
    })
    .sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99') || a.assignmentId.localeCompare(b.assignmentId));
  return markReadyDispatchSlot(draft);
}

export function dispatchPreflight(slot: DispatchSlot | null): DispatchPreflightItem[] {
  if (!slot) return [];
  return [
    {
      id: 'crew',
      title: 'Tripulación',
      detail: slot.instructorId ? `${slot.instructorName} asignado` : 'Falta instructor',
      ready: !!slot.instructorId,
    },
    {
      id: 'aircraft',
      title: 'Aeronave',
      detail: slot.aircraftId ? slot.aircraftLabel : 'Sin aeronave en la ejecución',
      ready: !!slot.aircraftId,
    },
    {
      id: 'curriculum',
      title: 'Rúbrica',
      detail:
        slot.maneuverNames.length > 0
          ? slot.maneuverNames.join(', ')
          : 'La ejecución no tiene maniobras cargadas',
      ready: slot.maneuverNames.length > 0 && !slot.programCulminated,
    },
  ];
}

export class GetDailyDispatchBoard {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, date: string): Observable<DailyDispatchBoard> {
    return forkJoin({
      snapshot: loadAcademicCatalog(this.catalog),
      maneuvers: this.catalog.listManeuvers(),
      fleets: this.catalog.listFleets(),
    }).pipe(
      map(({ snapshot, maneuvers, fleets }) => {
        const canDispatch = canDispatchMission(context.roleCode);
        const canOpenLiveSheet = canOpenLiveEvaluation(context.roleCode);
        if (operationalContextNeedsSquadronPick(context)) {
          return {
            needsSquadron: true,
            canDispatch,
            canOpenLiveSheet,
            date,
            slotCapacity: DISPATCH_DAILY_SLOT_CAPACITY,
            occupancyPercent: 0,
            totals: { scheduled: 0, airborne: 0, closed: 0, ready: 0 },
            slots: [],
            instructors: [],
          };
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
        const slots = buildSlots(snapshot, maneuvers, fleets, date, visibleIds);
        const active = slots.filter((item) => item.kind !== 'cancelled');
        const totals = {
          scheduled: active.length,
          airborne: slots.filter((item) => item.kind === 'airborne').length,
          closed: slots.filter((item) => item.kind === 'closed').length,
          ready: slots.filter((item) => item.kind === 'ready').length,
        };
        const instructorMap = new Map<string, string>();
        for (const slot of slots) {
          if (slot.instructorId) instructorMap.set(slot.instructorId, slot.instructorName);
        }
        return {
          needsSquadron: false,
          canDispatch,
          canOpenLiveSheet,
          date,
          slotCapacity: DISPATCH_DAILY_SLOT_CAPACITY,
          occupancyPercent: dispatchOccupancyPercent(active.length),
          totals,
          slots,
          instructors: [...instructorMap.entries()].map(([id, name]) => ({ id, name })),
        };
      }),
    );
  }
}

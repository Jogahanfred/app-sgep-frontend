import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type {
  AircraftEntity,
  GroundEvaluationRecord,
  GroundPeriodicExamRule,
  ProgramEnrollmentEntity,
  ProgramEntity,
  PromotionEntity,
  UserEntity,
} from '../../domain/entities/admin-catalog';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import {
  buildAcademicRecord,
  buildUserProgress,
  classifyCurriculumPlannerSlots,
  curriculumSlotEstimatedHours,
  isCurriculumSchedulable,
  nextSchedulablePlannerSlot,
  plannedSlotsForProgram,
  visibleStudentIds,
  type CurriculumPlannerSlot,
  type CurriculumPlannerStatus,
} from '../../domain/services/academic-progress';
import { isProgramCulminated } from '../../domain/services/admin-catalog';
import {
  groundAssessmentCompleted,
  groundAssessmentScore,
  groundSubjectSyllabus,
} from '../../domain/services/ground-instruction-grade';
import { enrollmentAllowsAcademicWrite } from '../../domain/services/program-enrollment';
import { canDispatchMission, isFlightInstructor } from '../../domain/services/mission-dispatch';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import {
  displayUserName,
  loadAcademicCatalog,
  studentIdsInCatalog,
  type AcademicCatalogSnapshot,
} from '../academic-catalog.snapshot';
import { isoCalendarDate } from './get-dashboard-overview';

export type FlightOrderRosterMode = 'promotion' | 'individual';
export type FlightOrderTraineeStatus = 'ready' | 'scheduled' | 'completed';
export type FlightOrderMissionStatus = CurriculumPlannerStatus;

export interface FlightOrderMissionOption {
  id: string;
  label: string;
  hours: number;
  recommended: boolean;
}

export interface FlightOrderMissionNode {
  id: string;
  code: string;
  name: string;
  hours: number;
  status: FlightOrderMissionStatus;
  average: number | null;
  instructorId: string | null;
  instructorName: string | null;
  aircraftId: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  history: string;
  phaseName: string;
  subphaseName: string;
  index: number;
  total: number;
}

export interface FlightOrderSubphaseNode {
  id: string;
  name: string;
  hours: number;
  coefficient?: number;
  loaded?: boolean;
  missions: FlightOrderMissionNode[];
}

export interface FlightOrderPhaseNode {
  id: string;
  name: string;
  moduleKind: 'ground' | 'air' | 'simulator';
  hours: number;
  completedCount: number;
  missionCount: number;
  percent: number;
  coefficient?: number;
  loaded?: boolean;
  subphases: FlightOrderSubphaseNode[];
}

export interface FlightOrderCurriculum {
  programId: string;
  programName: string;
  programCode: string;
  programType: string;
  plannedHours: number;
  programCulminated: boolean;
  groundPeriodicExams: GroundPeriodicExamRule[];
  phases: FlightOrderPhaseNode[];
}

export interface FlightOrderGroundCourse {
  id: string;
  name: string;
  hours: number;
  loaded: boolean;
}

export interface FlightOrderTrainee {
  id: string;
  userId: string;
  programId: string;
  enrollmentId: string;
  source: FlightOrderRosterMode;
  displayName: string;
  indicative: string | null;
  promotionId: string | null;
  promotionName: string | null;
  programName: string;
  programCode: string;
  phaseName: string | null;
  completedMissions: number;
  plannedMissions: number;
  percentComplete: number;
  accumulatedHours: number;
  average: number | null;
  academicStatus: 'in-progress' | 'completed' | 'suspended';
  nextMissionId: string | null;
  nextMissionLabel: string | null;
  nextMissionHours: number | null;
  status: FlightOrderTraineeStatus;
  openAssignmentId: string | null;
  lastCompletedLabel: string | null;
  programCulminated: boolean;
  canAssignGround: boolean;
  groundCourseIds: string[];
  groundCourses: FlightOrderGroundCourse[];
  missions: FlightOrderMissionOption[];
  curriculum: FlightOrderCurriculum;
}

export interface FlightOrderCohort {
  promotionId: string;
  code: string;
  name: string;
  enrolledCount: number;
  averagePercent: number;
  programNames: string[];
}

export interface FlightOrderChoice {
  id: string;
  name: string;
  hint: string;
}

export interface FlightOrderBoard {
  needsSquadron: boolean;
  canIssue: boolean;
  operationDate: string;
  nextOrderNumber: string;
  focusProgramId: string | null;
  cohorts: FlightOrderCohort[];
  trainees: FlightOrderTrainee[];
  instructors: FlightOrderChoice[];
  aircraft: FlightOrderChoice[];
}

export function flightOrderCorrelative(year: number, sequence: number): string {
  return `OV-${year}-${String(Math.max(1, sequence)).padStart(3, '0')}`;
}

function promotionInContext(promotion: PromotionEntity, context: OperationalContext): boolean {
  if (!context.unitId) return false;
  if (promotion.unitId !== context.unitId) return false;
  if (context.coversAllSquadrons || !context.squadronId) return true;
  return promotion.squadronId === context.squadronId;
}

function instructorInContext(user: UserEntity, context: OperationalContext): boolean {
  if (context.unitId && user.assignedUnitId && user.assignedUnitId !== context.unitId) return false;
  if (context.coversAllSquadrons || !context.squadronId) return true;
  if (!user.assignedSquadronId) return true;
  return user.assignedSquadronId === context.squadronId;
}

function aircraftInContext(aircraft: AircraftEntity, context: OperationalContext): boolean {
  if (!aircraft.operational || aircraft.status !== 'active') return false;
  if (!context.unitId) return false;
  return aircraft.unitId === context.unitId;
}

function missionType(snapshot: AcademicCatalogSnapshot, missionId: string): { code: string; name: string } {
  const mission = snapshot.missionTypes.find((item) => item.id === missionId);
  return { code: mission?.code ?? missionId, name: mission?.name ?? missionId };
}

function missionLabel(snapshot: AcademicCatalogSnapshot, missionId: string): string {
  const mission = missionType(snapshot, missionId);
  return `${mission.code}: ${mission.name}`;
}

function bankName(
  items: readonly { id: string; name: string }[],
  id: string,
): string {
  return items.find((item) => item.id === id)?.name ?? id;
}

function groundCourseMissions(
  userId: string,
  programCulminated: boolean,
  phaseName: string,
  courseId: string,
  courseName: string,
  bankCode: string,
  evaluations: readonly GroundEvaluationRecord[],
): FlightOrderMissionNode[] {
  const items = groundSubjectSyllabus(bankCode);
  const total = items.length;
  const byCode = new Map(evaluations.filter((item) => item.courseId === courseId).map((item) => [item.code, item]));
  const useRecordedProgress = evaluations.length > 0;
  return items.map((item, offset) => {
    const index = offset + 1;
    const recorded = byCode.get(item.code);
    if (recorded) {
      return {
        id: `${courseId}:${item.code}`,
        code: item.code,
        name: item.name,
        hours: 0,
        status: recorded.status,
        average: recorded.grade,
        instructorId: null,
        instructorName: null,
        aircraftId: null,
        scheduledDate: null,
        scheduledTime: null,
        history: '',
        phaseName,
        subphaseName: courseName,
        index,
        total,
      };
    }
    const completed = useRecordedProgress ? false : groundAssessmentCompleted(index, total, programCulminated);
    const status = completed ? 'completed' : 'blocked';
    const average = completed ? groundAssessmentScore(`${userId}:${courseId}:${item.code}`) : null;
    return {
      id: `${courseId}:${item.code}`,
      code: item.code,
      name: item.name,
      hours: 0,
      status,
      average,
      instructorId: null,
      instructorName: null,
      aircraftId: null,
      scheduledDate: null,
      scheduledTime: null,
      history: '',
      phaseName,
      subphaseName: courseName,
      index,
      total,
    };
  });
}

function programGroundCourses(
  snapshot: AcademicCatalogSnapshot,
  programId: string,
): { id: string; name: string; hours: number }[] {
  const phaseIds = snapshot.phases
    .filter((phase) => phase.programId === programId && phase.moduleKind === 'ground')
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((phase) => phase.id);
  return snapshot.subphases
    .filter((item) => phaseIds.includes(item.phaseId))
    .slice()
    .sort((a, b) => {
      const phaseA = phaseIds.indexOf(a.phaseId);
      const phaseB = phaseIds.indexOf(b.phaseId);
      if (phaseA !== phaseB) return phaseA - phaseB;
      return a.sortOrder - b.sortOrder;
    })
    .map((item) => ({
      id: item.id,
      name: bankName(snapshot.subphaseBanks, item.subphaseBankId),
      hours: item.hours,
    }));
}

function assignedGroundCourseIds(
  enrollment: ProgramEnrollmentEntity,
  catalog: readonly { id: string }[],
): string[] {
  if (!enrollment.groundCourseIds) return catalog.map((item) => item.id);
  return enrollment.groundCourseIds.filter((id) => catalog.some((item) => item.id === id));
}
function buildCurriculum(
  snapshot: AcademicCatalogSnapshot,
  program: ProgramEntity,
  classified: readonly CurriculumPlannerSlot[],
  userId: string,
  loadedGroundIds: ReadonlySet<string>,
  evaluations: readonly GroundEvaluationRecord[],
): FlightOrderCurriculum {
  const total = classified.length;
  const programCulminated = isProgramCulminated(program);
  const phases = snapshot.phases
    .filter((phase) => phase.programId === program.id)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((phase) => {
      const phaseName = bankName(snapshot.phaseBanks, phase.phaseBankId);
      const subphases = snapshot.subphases
        .filter((item) => item.phaseId === phase.id)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((subphase) => {
          const bank = snapshot.subphaseBanks.find((item) => item.id === subphase.subphaseBankId);
          const courseName = bank?.name ?? subphase.subphaseBankId;
          const loaded = phase.moduleKind !== 'ground' || loadedGroundIds.has(subphase.id);
          const flightMissions = classified
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.slot.subphaseId === subphase.id)
            .map(({ item, index }) => {
              const mission = missionType(snapshot, item.slot.ref.value);
              const instructorId = item.assignment?.instructorId ?? null;
              return {
                id: item.slot.ref.value,
                code: mission.code,
                name: mission.name,
                hours: curriculumSlotEstimatedHours(item.slot, snapshot.subphases),
                status: item.status,
                average: item.average,
                instructorId,
                instructorName: instructorId ? displayUserName(instructorId, snapshot) : null,
                aircraftId: item.execution?.aircraftId ?? null,
                scheduledDate: item.assignment?.date ?? item.execution?.startDate ?? null,
                scheduledTime: item.execution?.startTime ?? null,
                history: item.execution?.observations?.trim() ?? '',
                phaseName,
                subphaseName: courseName,
                index: index + 1,
                total,
              };
            });
          const missions =
            !loaded
              ? []
              : phase.moduleKind === 'ground' && flightMissions.length === 0
                ? groundCourseMissions(
                    userId,
                    programCulminated,
                    phaseName,
                    subphase.id,
                    courseName,
                    bank?.code ?? '',
                    evaluations,
                  )
                : flightMissions;
          return {
            id: subphase.id,
            name: courseName,
            hours: subphase.hours,
            loaded,
            ...(bank?.coefficient !== undefined ? { coefficient: bank.coefficient } : {}),
            missions,
          };
        });
      const phaseMissions = subphases.flatMap((item) => item.missions);
      const completedCount = phaseMissions.filter((item) => item.status === 'completed').length;
      const missionCount = phaseMissions.length;
      return {
        id: phase.id,
        name: phaseName,
        moduleKind: phase.moduleKind,
        hours: subphases.reduce((sum, item) => sum + item.hours, 0),
        completedCount,
        missionCount,
        percent: missionCount === 0 ? 0 : Math.round((completedCount / missionCount) * 100),
        subphases,
      };
    });
  return {
    programId: program.id,
    programName: program.name,
    programCode: program.code,
    programType: program.programType,
    plannedHours: phases.reduce((sum, item) => sum + item.hours, 0),
    programCulminated,
    groundPeriodicExams: [...(program.groundPeriodicExams ?? [])],
    phases,
  };
}

function emptyBoard(canIssue: boolean, operationDate: string): FlightOrderBoard {
  return {
    needsSquadron: true,
    canIssue,
    operationDate,
    nextOrderNumber: flightOrderCorrelative(Number(operationDate.slice(0, 4)), 1),
    focusProgramId: null,
    cohorts: [],
    trainees: [],
    instructors: [],
    aircraft: [],
  };
}

function boardFocusProgramId(
  trainees: readonly FlightOrderTrainee[],
  programs: AcademicCatalogSnapshot['programs'],
): string | null {
  const enrolled = new Set(trainees.map((item) => item.programId));
  const culminated = programs.filter((program) => enrolled.has(program.id) && isProgramCulminated(program));
  return culminated.find((program) => program.programType === 'HELI')?.id ?? culminated[0]?.id ?? null;
}

function buildTrainee(
  enrollment: ProgramEnrollmentEntity,
  snapshot: AcademicCatalogSnapshot,
): FlightOrderTrainee | null {
  const user = snapshot.users.find((item) => item.id === enrollment.userId);
  const program = snapshot.programs.find((item) => item.id === enrollment.programId);
  if (!user || !program) return null;
  const sources = {
    user,
    programs: snapshot.programs,
    phases: snapshot.phases,
    subphases: snapshot.subphases,
    assignments: snapshot.assignments,
    executions: snapshot.executions,
    enrollments: snapshot.enrollments,
  };
  const built = buildAcademicRecord(sources);
  const programRecord = built.record.programs.find((item) => item.programId === program.id);
  const progress = programRecord ? buildUserProgress(user, program, programRecord, sources) : null;
  const classified = classifyCurriculumPlannerSlots(user.id, program.id, sources);
  const current = nextSchedulablePlannerSlot(classified);
  const nextMissionId = current?.slot.ref.value ?? null;
  const missions: FlightOrderMissionOption[] = classified
    .filter((item) => isCurriculumSchedulable(item.status))
    .map((item) => ({
      id: item.slot.ref.value,
      label: missionLabel(snapshot, item.slot.ref.value),
      hours: curriculumSlotEstimatedHours(item.slot, snapshot.subphases),
      recommended: item.slot.ref.value === nextMissionId,
    }));
  const status: FlightOrderTraineeStatus = !current
    ? 'completed'
    : current.status === 'scheduled'
      ? 'scheduled'
      : 'ready';
  const phase = current?.slot.phaseId
    ? snapshot.phases.find((item) => item.id === current.slot.phaseId)
    : progress?.currentPhaseId
      ? snapshot.phases.find((item) => item.id === progress.currentPhaseId)
      : undefined;
  const phaseName = phase ? bankName(snapshot.phaseBanks, phase.phaseBankId) : null;
  const promotion = enrollment.promotionId
    ? snapshot.promotions.find((item) => item.id === enrollment.promotionId)
    : undefined;
  const lastEvaluation = programRecord?.evaluations[programRecord.evaluations.length - 1];
  const groundCatalog = programGroundCourses(snapshot, program.id);
  const groundCourseIds = assignedGroundCourseIds(enrollment, groundCatalog);
  const curriculum = buildCurriculum(
    snapshot,
    program,
    classified,
    user.id,
    new Set(groundCourseIds),
    enrollment.groundEvaluations ?? [],
  );
  return {
    id: enrollment.id,
    userId: user.id,
    programId: program.id,
    enrollmentId: enrollment.id,
    source: enrollment.source === 'promotion' ? 'promotion' : 'individual',
    displayName: `${user.firstName} ${user.lastName}`.trim(),
    indicative: user.indicative || null,
    promotionId: enrollment.promotionId,
    promotionName: promotion?.name ?? null,
    programName: program.name,
    programCode: program.code,
    phaseName,
    completedMissions: progress?.completedMissions ?? 0,
    plannedMissions: plannedSlotsForProgram(program.id, snapshot.phases, snapshot.subphases).length,
    percentComplete: progress?.percentComplete ?? 0,
    accumulatedHours: progress?.accumulatedHours ?? 0,
    average: progress?.average ?? null,
    academicStatus: progress?.academicStatus ?? 'in-progress',
    nextMissionId,
    nextMissionLabel: nextMissionId ? missionLabel(snapshot, nextMissionId) : null,
    nextMissionHours: current ? curriculumSlotEstimatedHours(current.slot, snapshot.subphases) : null,
    status,
    openAssignmentId: current?.assignment && current.status === 'scheduled' ? current.assignment.id : null,
    lastCompletedLabel: lastEvaluation ? missionLabel(snapshot, lastEvaluation.missionId) : null,
    programCulminated: isProgramCulminated(program),
    canAssignGround: enrollmentAllowsAcademicWrite(enrollment.status),
    groundCourseIds,
    groundCourses: groundCatalog.map((item) => ({ ...item, loaded: groundCourseIds.includes(item.id) })),
    missions,
    curriculum,
  };
}

export class GetFlightOrderBoard {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext): Observable<FlightOrderBoard> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        const operationDate = isoCalendarDate();
        const canIssue = canDispatchMission(context.roleCode);
        if (operationalContextNeedsSquadronPick(context)) {
          return emptyBoard(canIssue, operationDate);
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
        const trainees = snapshot.enrollments
          .filter((item) => item.status === 'active' && visibleIds.has(item.userId))
          .map((item) => buildTrainee(item, snapshot))
          .filter((item): item is FlightOrderTrainee => item !== null);
        const byPromotion = new Map<string, FlightOrderTrainee[]>();
        for (const trainee of trainees) {
          if (!trainee.promotionId || trainee.source !== 'promotion') continue;
          const list = byPromotion.get(trainee.promotionId) ?? [];
          list.push(trainee);
          byPromotion.set(trainee.promotionId, list);
        }
        const cohorts: FlightOrderCohort[] = [...byPromotion.entries()]
          .map(([promotionId, members]) => {
            const promotion = snapshot.promotions.find((item) => item.id === promotionId);
            if (!promotion || !promotionInContext(promotion, context)) return null;
            const programs = [...new Set(members.map((item) => item.programName))];
            const averagePercent = Math.round(
              members.reduce((sum, item) => sum + item.percentComplete, 0) / Math.max(1, members.length),
            );
            return {
              promotionId,
              code: promotion.code,
              name: promotion.name,
              enrolledCount: members.length,
              averagePercent,
              programNames: programs,
            };
          })
          .filter((item): item is FlightOrderCohort => item !== null)
          .sort((a, b) => {
            const yearA = snapshot.promotions.find((item) => item.id === a.promotionId)?.year ?? 0;
            const yearB = snapshot.promotions.find((item) => item.id === b.promotionId)?.year ?? 0;
            return yearB - yearA || a.name.localeCompare(b.name);
          });
        const year = Number(operationDate.slice(0, 4));
        return {
          needsSquadron: false,
          canIssue,
          operationDate,
          nextOrderNumber: flightOrderCorrelative(year, snapshot.assignments.length + 1),
          focusProgramId: boardFocusProgramId(trainees, snapshot.programs),
          cohorts,
          trainees,
          instructors: snapshot.users
            .filter((user) => isFlightInstructor(user, snapshot.roles) && instructorInContext(user, context))
            .map((user) => ({
              id: user.id,
              name: displayUserName(user.id, snapshot),
              hint: user.indicative || '',
            })),
          aircraft: snapshot.aircraft
            .filter((item) => aircraftInContext(item, context))
            .map((item) => ({
              id: item.id,
              name: item.registration,
              hint: item.operational ? 'Operativa' : 'No operativa',
            })),
        };
      }),
    );
  }
}

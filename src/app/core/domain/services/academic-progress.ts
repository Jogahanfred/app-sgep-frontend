import type {
  IndividualMissionAssignmentEntity,
  ManeuverGrade,
  MissionExecutionEntity,
  MissionResult,
  PhaseEntity,
  ProgramEntity,
  ProgramEnrollmentEntity,
  SubphaseEntity,
  UserEntity,
} from '../entities/admin-catalog';
import type {
  AcademicProgramStatus,
  AcademicTimelineEvent,
  RecordEntity,
  RecordProgramEntity,
  UserProgressEntity,
} from '../entities/academic-record';
import { MANEUVER_GRADE_SCORES } from '../entities/academic-record';
import { curriculumMissionRefs, type CurriculumMissionRef } from './admin-catalog';
import { mergeStudentProgramIds } from './program-enrollment';

export interface PlannedMissionSlot {
  phaseId: string;
  subphaseId: string;
  ref: CurriculumMissionRef;
}

export const CURRICULUM_PLANNER_STATUSES = [
  'completed',
  'scheduled',
  'available',
  'blocked',
  'recovery',
  'update',
] as const;
export type CurriculumPlannerStatus = (typeof CURRICULUM_PLANNER_STATUSES)[number];

export const CURRICULUM_SCHEDULABLE_STATUSES = ['available', 'scheduled', 'recovery', 'update'] as const;
export type CurriculumSchedulableStatus = (typeof CURRICULUM_SCHEDULABLE_STATUSES)[number];

export interface CurriculumPlannerSlot {
  slot: PlannedMissionSlot;
  status: CurriculumPlannerStatus;
  assignment: IndividualMissionAssignmentEntity | null;
  execution: MissionExecutionEntity | undefined;
  average: number | null;
}

export interface AcademicProgressSources {
  user: UserEntity;
  programs: readonly ProgramEntity[];
  phases: readonly PhaseEntity[];
  subphases: readonly SubphaseEntity[];
  assignments: readonly IndividualMissionAssignmentEntity[];
  executions: readonly MissionExecutionEntity[];
  enrollments?: readonly ProgramEnrollmentEntity[];
}

function gradeScore(grade: ManeuverGrade | null): number | null {
  if (!grade) return null;
  if (grade === 'NC' || grade === 'P') return null;
  return MANEUVER_GRADE_SCORES[grade];
}

function roundAverage(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function executionByAssignment(executions: readonly MissionExecutionEntity[]): Map<string, MissionExecutionEntity> {
  return new Map(executions.map((item) => [item.individualAssignmentId, item]));
}

export function plannedSlotsForProgram(
  programId: string,
  phases: readonly PhaseEntity[],
  subphases: readonly SubphaseEntity[],
): PlannedMissionSlot[] {
  const programPhases = phases.filter((phase) => phase.programId === programId).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const slots: PlannedMissionSlot[] = [];
  for (const phase of programPhases) {
    const phaseSubphases = subphases
      .filter((item) => item.phaseId === phase.id)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const subphase of phaseSubphases) {
      const refs = curriculumMissionRefs(subphase);
      for (const ref of refs) {
        slots.push({ phaseId: phase.id, subphaseId: subphase.id, ref });
      }
    }
  }
  return slots;
}

export function assignmentMatchesSlot(
  assignment: IndividualMissionAssignmentEntity,
  slot: PlannedMissionSlot,
): boolean {
  if (assignment.programId !== null && assignment.programId !== '') {
    return assignment.missionId === slot.ref.value || assignment.missionId === slot.ref.key;
  }
  return assignment.missionId === slot.ref.value || assignment.missionId === slot.ref.key;
}

export function curriculumSlotEstimatedHours(
  slot: PlannedMissionSlot,
  subphases: readonly SubphaseEntity[],
): number {
  const subphase = subphases.find((item) => item.id === slot.subphaseId);
  if (!subphase || subphase.hours <= 0) return 0;
  const count = Math.max(1, curriculumMissionRefs(subphase).length);
  return Math.round((subphase.hours / count) * 10) / 10;
}

export function nextPendingCurriculumSlot(
  userId: string,
  programId: string,
  sources: Pick<AcademicProgressSources, 'phases' | 'subphases' | 'assignments' | 'executions'>,
): { slot: PlannedMissionSlot; openAssignment: IndividualMissionAssignmentEntity | null } | null {
  const slots = plannedSlotsForProgram(programId, sources.phases, sources.subphases);
  const assignments = studentAssignments(userId, sources.assignments).filter((item) => item.programId === programId);
  const executions = executionByAssignment(sources.executions);
  const used = new Set<string>();
  for (const slot of slots) {
    const assignment = findAssignmentForSlot(assignments, slot, used);
    if (!assignment) return { slot, openAssignment: null };
    used.add(assignment.id);
    if (!isCompleted(assignment, executions.get(assignment.id))) {
      return { slot, openAssignment: assignment };
    }
  }
  return null;
}

export function isCurriculumSchedulable(status: CurriculumPlannerStatus): status is CurriculumSchedulableStatus {
  return (CURRICULUM_SCHEDULABLE_STATUSES as readonly string[]).includes(status);
}

function plannerStatusFromResult(result: MissionResult | null | undefined): CurriculumPlannerStatus | null {
  if (result === 'failed') return 'recovery';
  if (result === 'reinforcement') return 'update';
  return null;
}

export function classifyCurriculumPlannerSlots(
  userId: string,
  programId: string,
  sources: Pick<AcademicProgressSources, 'phases' | 'subphases' | 'assignments' | 'executions'>,
): CurriculumPlannerSlot[] {
  const slots = plannedSlotsForProgram(programId, sources.phases, sources.subphases);
  const assignments = studentAssignments(userId, sources.assignments).filter((item) => item.programId === programId);
  const executions = executionByAssignment(sources.executions);
  const used = new Set<string>();
  let currentTaken = false;
  const items: CurriculumPlannerSlot[] = [];
  for (const slot of slots) {
    const assignment = findAssignmentForSlot(assignments, slot, used) ?? null;
    if (assignment) used.add(assignment.id);
    const execution = assignment ? executions.get(assignment.id) : undefined;
    const average = evaluationAverage(execution);
    let status: CurriculumPlannerStatus;
    if (assignment && isCompleted(assignment, execution)) {
      const special = plannerStatusFromResult(execution?.result);
      if (special && !currentTaken) {
        status = special;
        currentTaken = true;
      } else if (special) {
        status = 'blocked';
      } else {
        status = 'completed';
      }
    } else if (assignment) {
      status = currentTaken ? 'blocked' : 'scheduled';
      currentTaken = true;
    } else if (!currentTaken) {
      status = 'available';
      currentTaken = true;
    } else {
      status = 'blocked';
    }
    items.push({ slot, status, assignment, execution, average });
  }
  return items;
}

export function nextSchedulablePlannerSlot(
  items: readonly CurriculumPlannerSlot[],
): CurriculumPlannerSlot | null {
  return items.find((item) => isCurriculumSchedulable(item.status)) ?? null;
}

export function classifyAirGradeSlots(
  userId: string,
  programId: string,
  sources: Pick<AcademicProgressSources, 'phases' | 'subphases' | 'assignments' | 'executions'>,
): CurriculumPlannerSlot[] {
  const airPhaseIds = new Set(
    sources.phases
      .filter((phase) => phase.programId === programId && phase.moduleKind === 'air')
      .map((phase) => phase.id),
  );
  const slots = plannedSlotsForProgram(programId, sources.phases, sources.subphases).filter((slot) =>
    airPhaseIds.has(slot.phaseId),
  );
  const assignments = studentAssignments(userId, sources.assignments).filter((item) => item.programId === programId);
  const executions = executionByAssignment(sources.executions);
  const used = new Set<string>();
  return slots.map((slot) => {
    const assignment = findAssignmentForSlot(assignments, slot, used) ?? null;
    if (assignment) used.add(assignment.id);
    const execution = assignment ? executions.get(assignment.id) : undefined;
    return {
      slot,
      status: assignment && isCompleted(assignment, execution) ? 'completed' : assignment ? 'scheduled' : 'available',
      assignment,
      execution,
      average: evaluationAverage(execution),
    };
  });
}

function isCompleted(
  assignment: IndividualMissionAssignmentEntity,
  execution: MissionExecutionEntity | undefined,
): boolean {
  if (execution?.status === 'completed') return true;
  return assignment.status === 'completed';
}

function studentAssignments(
  userId: string,
  assignments: readonly IndividualMissionAssignmentEntity[],
): IndividualMissionAssignmentEntity[] {
  return assignments.filter((item) => item.studentId === userId && item.status !== 'cancelled');
}

function programIdsForStudent(
  assignments: readonly IndividualMissionAssignmentEntity[],
  enrollments: readonly ProgramEnrollmentEntity[],
  userId: string,
): string[] {
  const fromAssignments: string[] = [];
  for (const item of assignments) {
    if (!item.programId) continue;
    if (!fromAssignments.includes(item.programId)) fromAssignments.push(item.programId);
  }
  const fromEnrollments = enrollments
    .filter((item) => item.userId === userId)
    .map((item) => item.programId);
  return mergeStudentProgramIds(fromAssignments, fromEnrollments);
}

function findAssignmentForSlot(
  slotsAssignments: readonly IndividualMissionAssignmentEntity[],
  slot: PlannedMissionSlot,
  used: Set<string>,
): IndividualMissionAssignmentEntity | undefined {
  return slotsAssignments.find((item) => !used.has(item.id) && assignmentMatchesSlot(item, slot));
}

function evaluationAverage(execution: MissionExecutionEntity | undefined): number | null {
  if (!execution) return null;
  const scores = execution.evaluations
    .map((item) => gradeScore(item.grade))
    .filter((value): value is number => value !== null);
  return roundAverage(scores);
}

function buildProgramRecord(
  user: UserEntity,
  program: ProgramEntity,
  sources: AcademicProgressSources,
): RecordProgramEntity {
  const slots = plannedSlotsForProgram(program.id, sources.phases, sources.subphases);
  const assignments = studentAssignments(user.id, sources.assignments).filter(
    (item) => item.programId === program.id,
  );
  const executions = executionByAssignment(sources.executions);
  const used = new Set<string>();
  const completedPhaseIds: string[] = [];
  const completedSubphaseIds: string[] = [];
  const executedMissionIds: string[] = [];
  const evaluations: RecordProgramEntity['evaluations'] = [];
  const scores: number[] = [];
  let hours = 0;
  let completedCount = 0;

  const bySubphase = new Map<string, { total: number; done: number }>();
  const byPhase = new Map<string, { total: number; done: number }>();

  for (const slot of slots) {
    const sub = bySubphase.get(slot.subphaseId) ?? { total: 0, done: 0 };
    const phase = byPhase.get(slot.phaseId) ?? { total: 0, done: 0 };
    sub.total += 1;
    phase.total += 1;
    const assignment = findAssignmentForSlot(assignments, slot, used);
    if (assignment) {
      used.add(assignment.id);
      const execution = executions.get(assignment.id);
      if (isCompleted(assignment, execution)) {
        completedCount += 1;
        sub.done += 1;
        phase.done += 1;
        executedMissionIds.push(assignment.missionId);
        hours += execution?.executedHours ?? 0;
        const avg = evaluationAverage(execution);
        if (avg !== null) scores.push(avg);
        evaluations.push({
          assignmentId: assignment.id,
          missionId: assignment.missionId,
          date: assignment.date,
          result: execution?.result ?? null,
          average: avg,
          instructorId: assignment.instructorId,
        });
      }
    }
    bySubphase.set(slot.subphaseId, sub);
    byPhase.set(slot.phaseId, phase);
  }

  for (const [subphaseId, tally] of bySubphase) {
    if (tally.total > 0 && tally.done >= tally.total) completedSubphaseIds.push(subphaseId);
  }
  for (const [phaseId, tally] of byPhase) {
    if (tally.total > 0 && tally.done >= tally.total) completedPhaseIds.push(phaseId);
  }

  const planned = slots.length;
  const allDone = planned > 0 && completedCount >= planned;
  const hasFailed = evaluations.some((item) => item.result === 'failed');
  let status: AcademicProgramStatus = 'in-progress';
  if (hasFailed) status = 'suspended';
  else if (allDone) status = 'completed';
  else if (user.status === 'inactive') status = 'suspended';

  const dates = assignments.map((item) => item.date).filter(Boolean).sort();
  const enrollmentDate =
    sources.enrollments?.find((item) => item.userId === user.id && item.programId === program.id)?.enrolledAt ?? null;
  const startDate = dates[0] ?? enrollmentDate;
  const endDate = allDone ? (dates[dates.length - 1] ?? null) : null;

  return {
    programId: program.id,
    status,
    average: roundAverage(scores),
    accumulatedHours: Math.round(hours * 10) / 10,
    startDate,
    endDate,
    completedPhaseIds,
    completedSubphaseIds,
    executedMissionIds,
    evaluations,
    certifications: status === 'completed' ? [`Certificación · ${program.name}`] : [],
  };
}

function currentSlot(
  programId: string,
  record: RecordProgramEntity,
  sources: AcademicProgressSources,
): PlannedMissionSlot | null {
  const slots = plannedSlotsForProgram(programId, sources.phases, sources.subphases);
  return slots.find((slot) => !record.completedSubphaseIds.includes(slot.subphaseId)) ?? slots[slots.length - 1] ?? null;
}

export function buildUserProgress(
  user: UserEntity,
  program: ProgramEntity,
  record: RecordProgramEntity,
  sources: AcademicProgressSources,
): UserProgressEntity {
  const slots = plannedSlotsForProgram(program.id, sources.phases, sources.subphases);
  const planned = slots.length;
  const completed = record.evaluations.length;
  const pending = Math.max(0, planned - completed);
  const percent = planned === 0 ? 0 : Math.min(100, Math.round((completed / planned) * 100));
  const current = record.status === 'completed' ? null : currentSlot(program.id, record, sources);
  const assignments = studentAssignments(user.id, sources.assignments).filter((item) => item.programId === program.id);
  const latestInstructor = [...assignments].reverse().find((item) => item.instructorId)?.instructorId ?? null;

  return {
    userId: user.id,
    programId: program.id,
    percentComplete: percent,
    currentPhaseId: current?.phaseId ?? null,
    currentSubphaseId: current?.subphaseId ?? null,
    instructorId: latestInstructor,
    completedMissions: completed,
    pendingMissions: pending,
    accumulatedHours: record.accumulatedHours,
    average: record.average,
    academicStatus: record.status,
  };
}

export function programOutcome(status: AcademicProgramStatus): 'passed' | 'failed' | 'in-progress' {
  if (status === 'completed') return 'passed';
  if (status === 'suspended') return 'failed';
  return 'in-progress';
}

export function cohortRanksByAverage(
  rows: readonly { userId: string; status: AcademicProgramStatus; average: number | null }[],
): Map<string, number> {
  const passed = rows
    .filter((item) => item.status === 'completed')
    .slice()
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0) || a.userId.localeCompare(b.userId));
  return new Map(passed.map((item, index) => [item.userId, index + 1]));
}

export function buildAcademicRecord(sources: AcademicProgressSources): {
  record: RecordEntity;
  progress: UserProgressEntity | null;
} {
  const assignments = studentAssignments(sources.user.id, sources.assignments);
  const programIds = programIdsForStudent(assignments, sources.enrollments ?? [], sources.user.id);
  const programs = programIds
    .map((id) => sources.programs.find((program) => program.id === id))
    .filter((program): program is ProgramEntity => !!program);
  const records = programs.map((program) => buildProgramRecord(sources.user, program, sources));
  const currentRecord =
    records.find((item) => item.status === 'in-progress') ??
    records.find((item) => item.status === 'suspended') ??
    [...records].sort((a, b) => (b.endDate ?? b.startDate ?? '').localeCompare(a.endDate ?? a.startDate ?? ''))[0] ??
    null;
  const currentProgram = currentRecord
    ? programs.find((program) => program.id === currentRecord.programId) ?? null
    : null;
  const progress =
    currentRecord && currentProgram
      ? buildUserProgress(sources.user, currentProgram, currentRecord, sources)
      : null;

  return {
    record: { userId: sources.user.id, programs: records },
    progress,
  };
}

export function buildAcademicTimeline(
  record: RecordProgramEntity,
  phases: readonly PhaseEntity[],
  phaseName: (phaseId: string) => string,
): AcademicTimelineEvent[] {
  const events: AcademicTimelineEvent[] = [];
  events.push({
    id: `${record.programId}-start`,
    kind: 'program-started',
    labelKey: 'program-started',
    programId: record.programId,
    phaseId: null,
    date: record.startDate,
  });
  const programPhases = phases
    .filter((phase) => phase.programId === record.programId)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
  let insertedEvaluation = false;
  for (const phase of programPhases) {
    if (record.completedPhaseIds.includes(phase.id)) {
      events.push({
        id: `${phase.id}-done`,
        kind: 'phase-completed',
        labelKey: 'phase-completed',
        programId: record.programId,
        phaseId: phase.id,
        date: record.endDate,
      });
      if (!insertedEvaluation && record.evaluations.length > 0) {
        events.push({
          id: `${record.programId}-eval`,
          kind: 'evaluation',
          labelKey: 'evaluation',
          programId: record.programId,
          phaseId: phase.id,
          date: record.evaluations[0]?.date ?? null,
        });
        insertedEvaluation = true;
      }
    } else if (record.status === 'in-progress') {
      events.push({
        id: `${phase.id}-start`,
        kind: 'phase-started',
        labelKey: 'phase-started',
        programId: record.programId,
        phaseId: phase.id,
        date: null,
      });
      break;
    }
  }
  if (record.status === 'in-progress') {
    events.push({
      id: `${record.programId}-current`,
      kind: 'program-current',
      labelKey: 'program-current',
      programId: record.programId,
      phaseId: null,
      date: null,
    });
  }
  void phaseName;
  return events;
}

export function visibleStudentIds(params: {
  actorUserId: string;
  roleCode: string;
  unitId: string | null;
  squadronId: string | null;
  coversAllSquadrons: boolean;
  users: readonly UserEntity[];
  studentUserIds: ReadonlySet<string>;
}): string[] {
  const { actorUserId, roleCode, unitId, squadronId, coversAllSquadrons, users, studentUserIds } = params;
  if (roleCode === 'PILOT') return studentUserIds.has(actorUserId) ? [actorUserId] : [actorUserId];
  return users
    .filter((user) => studentUserIds.has(user.id))
    .filter((user) => {
      if (roleCode === 'AUDIT') return true;
      if (!unitId) return false;
      if (user.assignedUnitId !== unitId) return false;
      if (coversAllSquadrons || !squadronId) return true;
      return user.assignedSquadronId === squadronId;
    })
    .map((user) => user.id);
}

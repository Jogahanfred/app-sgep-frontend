import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { PromotionEntity } from '../../domain/entities/admin-catalog';
import { buildAcademicRecord } from '../../domain/services/academic-progress';
import { dashboardKindForRole, type DashboardKind } from '../../domain/services/dashboard-kind';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import { visibleStudentIds } from '../../domain/services/academic-progress';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import {
  displayUserName,
  loadAcademicCatalog,
  studentIdsInCatalog,
  type AcademicCatalogSnapshot,
} from '../academic-catalog.snapshot';

export interface DashboardLine {
  id: string;
  title: string;
  meta: string;
}

export interface DirectorDashboard {
  kind: 'director';
  needsSquadron: boolean;
  activeStudents: number;
  activePrograms: number;
  missionsToday: number;
  hoursFlown: number;
  activePromotions: number;
  programStatus: DashboardLine[];
  missionActivity: { scheduled: number; inProgress: number; completed: number };
  studentDistribution: DashboardLine[];
  hoursTrend: DashboardLine[];
  academicActivity: DashboardLine[];
  alerts: DashboardLine[];
}

export interface InstructorDashboard {
  kind: 'instructor';
  needsSquadron: boolean;
  assignedMissions: number;
  assignedStudents: number;
  pendingEvaluations: number;
  upcoming: DashboardLine[];
  pendingStudents: DashboardLine[];
  pendingEvaluationsList: DashboardLine[];
  recentGrades: DashboardLine[];
  studentProgress: DashboardLine[];
}

export interface StudentDashboard {
  kind: 'student';
  needsSquadron: boolean;
  percentComplete: number | null;
  hours: number;
  average: number | null;
  nextMission: DashboardLine | null;
  programName: string | null;
  phaseName: string | null;
  subphaseName: string | null;
  recentEvaluations: DashboardLine[];
  recentMissions: DashboardLine[];
  pending: DashboardLine[];
}

export type RoleDashboard = DirectorDashboard | InstructorDashboard | StudentDashboard;

export function isoCalendarDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function scopedStudentIds(context: OperationalContext, snapshot: AcademicCatalogSnapshot): string[] {
  return visibleStudentIds({
    actorUserId: context.userId,
    roleCode: context.roleCode,
    unitId: context.unitId,
    squadronId: context.squadronId,
    coversAllSquadrons: context.coversAllSquadrons,
    users: snapshot.users,
    studentUserIds: studentIdsInCatalog(snapshot),
  });
}

function promotionInScope(promotion: PromotionEntity, context: OperationalContext): boolean {
  if (context.roleCode === 'AUDIT') return true;
  if (!context.unitId) return false;
  if (promotion.unitId !== context.unitId) return false;
  if (context.coversAllSquadrons || !context.squadronId) return true;
  return promotion.squadronId === context.squadronId;
}

function executionMap(snapshot: AcademicCatalogSnapshot) {
  return new Map(snapshot.executions.map((item) => [item.individualAssignmentId, item]));
}

function missionName(missionId: string, snapshot: AcademicCatalogSnapshot): string {
  return snapshot.missionTypes.find((item) => item.id === missionId)?.name ?? missionId;
}

function roundHours(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildDirector(
  context: OperationalContext,
  snapshot: AcademicCatalogSnapshot,
  asOf: string,
  needsSquadron: boolean,
): DirectorDashboard {
  const studentIds = scopedStudentIds(context, snapshot);
  const students = snapshot.users.filter((user) => studentIds.includes(user.id) && user.status === 'active');
  const assignments = snapshot.assignments.filter(
    (item) => item.studentId && studentIds.includes(item.studentId) && item.status !== 'cancelled',
  );
  const executions = executionMap(snapshot);
  const hours = assignments.reduce((total, item) => {
    const execution = executions.get(item.id);
    return total + (execution?.status === 'completed' ? execution.executedHours : 0);
  }, 0);
  const missionsToday = assignments.filter((item) => item.date === asOf).length;
  const activity = { scheduled: 0, inProgress: 0, completed: 0 };
  for (const assignment of assignments) {
    const status = executions.get(assignment.id)?.status ?? (assignment.status === 'completed' ? 'completed' : 'scheduled');
    if (status === 'completed') activity.completed += 1;
    else if (status === 'in-progress') activity.inProgress += 1;
    else activity.scheduled += 1;
  }
  const programBuckets = new Map<string, number>();
  for (const id of studentIds) {
    const user = snapshot.users.find((item) => item.id === id);
    if (!user) continue;
    const { progress } = buildAcademicRecord({
      user,
      programs: snapshot.programs,
      phases: snapshot.phases,
      subphases: snapshot.subphases,
      assignments: snapshot.assignments,
      executions: snapshot.executions,
      enrollments: snapshot.enrollments,
    });
    if (progress?.academicStatus === 'in-progress') {
      programBuckets.set(progress.programId, (programBuckets.get(progress.programId) ?? 0) + 1);
    }
  }
  const programStatus = [...programBuckets.entries()].map(([programId, count]) => ({
    id: programId,
    title: snapshot.programs.find((item) => item.id === programId)?.name ?? programId,
    meta: String(count),
  }));
  const distribution = new Map<string, number>();
  for (const student of students) {
    const squadron = snapshot.squadrons.find((item) => item.id === student.assignedSquadronId);
    const label = squadron?.name ?? 'Sin escuadrón';
    distribution.set(label, (distribution.get(label) ?? 0) + 1);
  }
  const trend = new Map<string, number>();
  for (const assignment of assignments) {
    const execution = executions.get(assignment.id);
    if (execution?.status !== 'completed' || !execution.startDate) continue;
    const month = execution.startDate.slice(0, 7);
    trend.set(month, (trend.get(month) ?? 0) + execution.executedHours);
  }
  const hoursTrend = [...trend.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([label, value]) => ({ id: label, title: label, meta: String(roundHours(value)) }));
  const academicActivity = assignments
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: `${displayUserName(item.studentId, snapshot)} · ${missionName(item.missionId, snapshot)}`,
      meta: item.date,
    }));
  const alerts: DashboardLine[] = [];
  const pendingEval = assignments.filter((item) => {
    const execution = executions.get(item.id);
    return execution && execution.status !== 'completed';
  }).length;
  if (pendingEval > 0) {
    alerts.push({ id: 'pending-exec', title: 'Misiones sin cerrar', meta: String(pendingEval) });
  }
  const overdue = assignments.filter((item) => item.date < asOf && item.status === 'scheduled').length;
  if (overdue > 0) {
    alerts.push({ id: 'overdue', title: 'Misiones programadas vencidas', meta: String(overdue) });
  }
  const promotions = snapshot.promotions.filter(
    (item) => promotionInScope(item, context) && item.startDate <= asOf && item.endDate >= asOf,
  );
  return {
    kind: 'director',
    needsSquadron,
    activeStudents: students.length,
    activePrograms: programStatus.length || snapshot.programs.filter((item) => item.status === 'active').length,
    missionsToday,
    hoursFlown: roundHours(hours),
    activePromotions: promotions.length,
    programStatus,
    missionActivity: activity,
    studentDistribution: [...distribution.entries()].map(([title, count]) => ({
      id: title,
      title,
      meta: String(count),
    })),
    hoursTrend,
    academicActivity,
    alerts,
  };
}

function buildInstructor(
  context: OperationalContext,
  snapshot: AcademicCatalogSnapshot,
  asOf: string,
  needsSquadron: boolean,
): InstructorDashboard {
  const mine = snapshot.assignments.filter(
    (item) => item.instructorId === context.userId && item.status !== 'cancelled',
  );
  const executions = executionMap(snapshot);
  const studentIds = [...new Set(mine.map((item) => item.studentId).filter((id): id is string => !!id))];
  const pendingEval = mine.filter((item) => {
    const execution = executions.get(item.id);
    if (!execution) return item.status !== 'completed';
    if (execution.status !== 'completed') return true;
    return execution.evaluations.some((evaluation) => evaluation.grade === null);
  });
  const upcoming = mine
    .filter((item) => item.date >= asOf && item.status !== 'completed')
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      title: missionName(item.missionId, snapshot),
      meta: `${displayUserName(item.studentId, snapshot)} · ${item.date}`,
    }));
  const pendingStudents = studentIds
    .map((id) => {
      const open = mine.filter((item) => item.studentId === id && item.status !== 'completed').length;
      return { id, title: displayUserName(id, snapshot), meta: String(open) };
    })
    .filter((item) => Number(item.meta) > 0)
    .slice(0, 6);
  const recentGrades = mine
    .map((item) => ({ item, execution: executions.get(item.id) }))
    .filter((entry) => entry.execution?.status === 'completed')
    .slice(-6)
    .reverse()
    .map((entry) => ({
      id: entry.item.id,
      title: displayUserName(entry.item.studentId, snapshot),
      meta: missionName(entry.item.missionId, snapshot),
    }));
  const studentProgress = studentIds.slice(0, 6).map((id) => {
    const user = snapshot.users.find((item) => item.id === id);
    if (!user) return { id, title: displayUserName(id, snapshot), meta: '—' };
    const { progress } = buildAcademicRecord({
      user,
      programs: snapshot.programs,
      phases: snapshot.phases,
      subphases: snapshot.subphases,
      assignments: snapshot.assignments,
      executions: snapshot.executions,
      enrollments: snapshot.enrollments,
    });
    return {
      id,
      title: displayUserName(id, snapshot),
      meta: progress ? `${progress.percentComplete} %` : '—',
    };
  });
  return {
    kind: 'instructor',
    needsSquadron,
    assignedMissions: mine.length,
    assignedStudents: studentIds.length,
    pendingEvaluations: pendingEval.length,
    upcoming,
    pendingStudents,
    pendingEvaluationsList: pendingEval.slice(0, 6).map((item) => ({
      id: item.id,
      title: missionName(item.missionId, snapshot),
      meta: displayUserName(item.studentId, snapshot),
    })),
    recentGrades,
    studentProgress,
  };
}

function buildStudent(
  context: OperationalContext,
  snapshot: AcademicCatalogSnapshot,
  asOf: string,
  needsSquadron: boolean,
): StudentDashboard {
  const user = snapshot.users.find((item) => item.id === context.userId);
  const assignments = snapshot.assignments.filter(
    (item) => item.studentId === context.userId && item.status !== 'cancelled',
  );
  const executions = executionMap(snapshot);
  const built = user
    ? buildAcademicRecord({
        user,
        programs: snapshot.programs,
        phases: snapshot.phases,
        subphases: snapshot.subphases,
        assignments: snapshot.assignments,
        executions: snapshot.executions,
        enrollments: snapshot.enrollments,
      })
    : { progress: null, record: { userId: context.userId, programs: [] } };
  const progress = built.progress;
  const program = progress ? snapshot.programs.find((item) => item.id === progress.programId) : null;
  const phase = progress?.currentPhaseId
    ? snapshot.phases.find((item) => item.id === progress.currentPhaseId)
    : null;
  const subphase = progress?.currentSubphaseId
    ? snapshot.subphases.find((item) => item.id === progress.currentSubphaseId)
    : null;
  const next = assignments
    .filter((item) => item.date >= asOf && item.status !== 'completed')
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const recentCompleted = assignments
    .filter((item) => executions.get(item.id)?.status === 'completed')
    .slice(-5)
    .reverse();
  return {
    kind: 'student',
    needsSquadron,
    percentComplete: progress?.percentComplete ?? null,
    hours: progress?.accumulatedHours ?? 0,
    average: progress?.average ?? null,
    nextMission: next
      ? { id: next.id, title: missionName(next.missionId, snapshot), meta: next.date }
      : null,
    programName: program?.name ?? null,
    phaseName: phase ? (snapshot.phaseBanks.find((item) => item.id === phase.phaseBankId)?.name ?? null) : null,
    subphaseName: subphase
      ? (snapshot.subphaseBanks.find((item) => item.id === subphase.subphaseBankId)?.name ?? null)
      : null,
    recentEvaluations: recentCompleted.map((item) => ({
      id: item.id,
      title: missionName(item.missionId, snapshot),
      meta: item.date,
    })),
    recentMissions: recentCompleted.map((item) => ({
      id: `${item.id}-m`,
      title: missionName(item.missionId, snapshot),
      meta: item.date,
    })),
    pending: assignments
      .filter((item) => item.status !== 'completed')
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        title: missionName(item.missionId, snapshot),
        meta: item.date,
      })),
  };
}

export class GetDashboardOverview {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, asOfDate = isoCalendarDate()): Observable<RoleDashboard> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        const needsSquadron = operationalContextNeedsSquadronPick(context);
        const kind: DashboardKind = dashboardKindForRole(context.roleCode);
        if (kind === 'instructor') return buildInstructor(context, snapshot, asOfDate, needsSquadron);
        if (kind === 'student') return buildStudent(context, snapshot, asOfDate, needsSquadron);
        return buildDirector(context, snapshot, asOfDate, needsSquadron);
      }),
    );
  }
}

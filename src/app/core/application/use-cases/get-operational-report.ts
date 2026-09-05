import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { RoleCode } from '../../domain/entities/role-code';
import { buildAcademicRecord } from '../../domain/services/academic-progress';
import { visibleStudentIds } from '../../domain/services/academic-progress';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import {
  displayUserName,
  loadAcademicCatalog,
  studentIdsInCatalog,
  type AcademicCatalogSnapshot,
} from '../academic-catalog.snapshot';

export const REPORT_KINDS = [
  'student-history',
  'promotion-history',
  'academic-stats',
  'student-ranking',
  'promotion-ranking',
  'hours-by-program',
  'hours-by-aircraft',
  'instructor-performance',
] as const;

export type ReportKind = (typeof REPORT_KINDS)[number];

export interface ReportQuery {
  kind: ReportKind;
  from: string | null;
  to: string | null;
  programId: string | null;
  promotionId: string | null;
  studentId: string | null;
  instructorId: string | null;
  aircraftId: string | null;
}

export interface ReportColumn {
  id: string;
  header: string;
}

export interface ReportOption {
  id: string;
  label: string;
}

export interface OperationalReport {
  needsSquadron: boolean;
  kind: ReportKind;
  allowedKinds: ReportKind[];
  columns: ReportColumn[];
  rows: Record<string, string>[];
  programs: ReportOption[];
  promotions: ReportOption[];
  students: ReportOption[];
  instructors: ReportOption[];
  aircraft: ReportOption[];
}

export function reportKindsForRole(role: RoleCode): ReportKind[] {
  if (role === 'PILOT') return ['student-history'];
  return [...REPORT_KINDS];
}

function inDateRange(date: string, query: ReportQuery): boolean {
  if (query.from && date < query.from) return false;
  if (query.to && date > query.to) return false;
  return true;
}

function scopedStudents(context: OperationalContext, snapshot: AcademicCatalogSnapshot): string[] {
  const visible = visibleStudentIds({
    actorUserId: context.userId,
    roleCode: context.roleCode,
    unitId: context.unitId,
    squadronId: context.squadronId,
    coversAllSquadrons: context.coversAllSquadrons,
    users: snapshot.users,
    studentUserIds: studentIdsInCatalog(snapshot),
  });
  if (context.roleCode === 'INSTR' || context.roleCode === 'EVALU') {
    const mine = new Set(
      snapshot.assignments
        .filter((item) => item.instructorId === context.userId && item.studentId)
        .map((item) => item.studentId as string),
    );
    return visible.filter((id) => mine.has(id));
  }
  return visible;
}

function assignmentsInScope(context: OperationalContext, snapshot: AcademicCatalogSnapshot, query: ReportQuery) {
  const students = new Set(scopedStudents(context, snapshot));
  if (context.roleCode === 'PILOT') {
    students.clear();
    students.add(context.userId);
  }
  const promotionMembers = query.promotionId
    ? new Set(snapshot.members.filter((item) => item.promotionId === query.promotionId).map((item) => item.userId))
    : null;
  return snapshot.assignments.filter((item) => {
    if (item.status === 'cancelled') return false;
    if (item.studentId && !students.has(item.studentId)) return false;
    if (query.studentId && item.studentId !== query.studentId) return false;
    if (query.instructorId && item.instructorId !== query.instructorId) return false;
    if (query.programId && item.programId !== query.programId) return false;
    if (promotionMembers && item.studentId && !promotionMembers.has(item.studentId)) return false;
    if (!inDateRange(item.date, query)) return false;
    return true;
  });
}

function promotionsInScope(context: OperationalContext, snapshot: AcademicCatalogSnapshot) {
  return snapshot.promotions.filter((promotion) => {
    if (context.roleCode === 'AUDIT') return true;
    if (!context.unitId) return false;
    if (promotion.unitId !== context.unitId) return false;
    if (context.coversAllSquadrons || !context.squadronId) return true;
    return promotion.squadronId === context.squadronId;
  });
}

function buildRows(kind: ReportKind, context: OperationalContext, snapshot: AcademicCatalogSnapshot, query: ReportQuery): { columns: ReportColumn[]; rows: Record<string, string>[] } {
  const assignments = assignmentsInScope(context, snapshot, query);
  const executions = new Map(snapshot.executions.map((item) => [item.individualAssignmentId, item]));
  const students = scopedStudents(context, snapshot);

  if (kind === 'student-history') {
    return {
      columns: [
        { id: 'student', header: 'Alumno' },
        { id: 'date', header: 'Fecha' },
        { id: 'program', header: 'Programa' },
        { id: 'mission', header: 'Misión' },
        { id: 'hours', header: 'Horas' },
        { id: 'status', header: 'Estado' },
      ],
      rows: assignments.map((item) => {
        const execution = executions.get(item.id);
        return {
          student: displayUserName(item.studentId, snapshot),
          date: item.date,
          program: snapshot.programs.find((entry) => entry.id === item.programId)?.name ?? '—',
          mission: snapshot.missionTypes.find((entry) => entry.id === item.missionId)?.name ?? item.missionId,
          hours: String(execution?.executedHours ?? 0),
          status: execution?.status ?? item.status,
        };
      }),
    };
  }

  if (kind === 'promotion-history') {
    const promotions = promotionsInScope(context, snapshot).filter((item) => !query.promotionId || item.id === query.promotionId);
    const members = snapshot.members.filter((item) => !query.promotionId || item.promotionId === query.promotionId);
    return {
      columns: [
        { id: 'promotion', header: 'Promoción' },
        { id: 'student', header: 'Alumno' },
        { id: 'entry', header: 'Ingreso' },
      ],
      rows: members
        .filter((member) => students.includes(member.userId) && promotions.some((item) => item.id === member.promotionId))
        .map((member) => ({
          promotion: promotions.find((item) => item.id === member.promotionId)?.name ?? member.promotionId,
          student: displayUserName(member.userId, snapshot),
          entry: member.entryDate,
        })),
    };
  }

  if (kind === 'student-ranking' || kind === 'academic-stats') {
    const promotionMembers = query.promotionId
      ? new Set(snapshot.members.filter((item) => item.promotionId === query.promotionId).map((item) => item.userId))
      : null;
    const rows = students.filter((id) => !promotionMembers || promotionMembers.has(id)).map((id) => {
      const user = snapshot.users.find((item) => item.id === id);
      if (!user) {
        return { student: id, progress: '—', average: '—', hours: '—' };
      }
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
        student: displayUserName(id, snapshot),
        progress: progress ? `${progress.percentComplete} %` : '—',
        average: progress?.average === null || progress?.average === undefined ? '—' : String(progress.average),
        hours: progress ? String(progress.accumulatedHours) : '0',
      };
    });
    if (kind === 'student-ranking') {
      rows.sort((a, b) => Number.parseFloat(b.average) - Number.parseFloat(a.average));
    }
    return {
      columns: [
        { id: 'student', header: 'Alumno' },
        { id: 'progress', header: 'Avance' },
        { id: 'average', header: 'Promedio' },
        { id: 'hours', header: 'Horas' },
      ],
      rows,
    };
  }

  if (kind === 'promotion-ranking') {
    const rows = promotionsInScope(context, snapshot)
      .filter((promotion) => !query.promotionId || promotion.id === query.promotionId)
      .map((promotion) => {
        const memberIds = snapshot.members.filter((item) => item.promotionId === promotion.id).map((item) => item.userId);
        const averages = memberIds
          .filter((id) => students.includes(id))
          .map((id) => {
            const user = snapshot.users.find((item) => item.id === id);
            if (!user) return null;
            return buildAcademicRecord({
              user,
              programs: snapshot.programs,
              phases: snapshot.phases,
              subphases: snapshot.subphases,
              assignments: snapshot.assignments,
              executions: snapshot.executions,
              enrollments: snapshot.enrollments,
            }).progress?.average ?? null;
          })
          .filter((value): value is number => value !== null);
        const avg =
          averages.length === 0 ? '—' : String(Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 10) / 10);
        return {
          promotion: promotion.name,
          members: String(memberIds.filter((id) => students.includes(id)).length),
          average: avg,
        };
      });
    return {
      columns: [
        { id: 'promotion', header: 'Promoción' },
        { id: 'members', header: 'Alumnos' },
        { id: 'average', header: 'Promedio' },
      ],
      rows,
    };
  }

  if (kind === 'hours-by-program') {
    const buckets = new Map<string, number>();
    for (const item of assignments) {
      const execution = executions.get(item.id);
      if (execution?.status !== 'completed') continue;
      const key = item.programId ?? 'none';
      buckets.set(key, (buckets.get(key) ?? 0) + execution.executedHours);
    }
    return {
      columns: [
        { id: 'program', header: 'Programa' },
        { id: 'hours', header: 'Horas' },
      ],
      rows: [...buckets.entries()].map(([id, hours]) => ({
        program: snapshot.programs.find((item) => item.id === id)?.name ?? 'Sin programa',
        hours: String(Math.round(hours * 10) / 10),
      })),
    };
  }

  if (kind === 'hours-by-aircraft') {
    const buckets = new Map<string, number>();
    for (const item of assignments) {
      const execution = executions.get(item.id);
      if (execution?.status !== 'completed') continue;
      if (query.aircraftId && execution.aircraftId !== query.aircraftId) continue;
      const key = execution.aircraftId ?? 'none';
      buckets.set(key, (buckets.get(key) ?? 0) + execution.executedHours);
    }
    return {
      columns: [
        { id: 'aircraft', header: 'Aeronave' },
        { id: 'hours', header: 'Horas' },
      ],
      rows: [...buckets.entries()].map(([id, hours]) => ({
        aircraft: snapshot.aircraft.find((item) => item.id === id)?.registration ?? 'Sin aeronave',
        hours: String(Math.round(hours * 10) / 10),
      })),
    };
  }

  const buckets = new Map<string, { hours: number; missions: number }>();
  for (const item of assignments) {
    if (!item.instructorId) continue;
    const execution = executions.get(item.id);
    const current = buckets.get(item.instructorId) ?? { hours: 0, missions: 0 };
    if (execution?.status === 'completed') {
      current.hours += execution.executedHours;
      current.missions += 1;
    }
    buckets.set(item.instructorId, current);
  }
  return {
    columns: [
      { id: 'instructor', header: 'Instructor' },
      { id: 'missions', header: 'Misiones' },
      { id: 'hours', header: 'Horas' },
    ],
    rows: [...buckets.entries()].map(([id, value]) => ({
      instructor: displayUserName(id, snapshot),
      missions: String(value.missions),
      hours: String(Math.round(value.hours * 10) / 10),
    })),
  };
}

export class GetOperationalReport {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, query: ReportQuery): Observable<OperationalReport> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        const allowedKinds = reportKindsForRole(context.roleCode);
        const kind = allowedKinds.includes(query.kind) ? query.kind : allowedKinds[0]!;
        const effective: ReportQuery =
          context.roleCode === 'PILOT' ? { ...query, kind, studentId: context.userId } : { ...query, kind };
        const built = buildRows(kind, context, snapshot, effective);
        const students = scopedStudents(context, snapshot);
        const instructorIds = [
          ...new Set(
            snapshot.assignments
              .filter((item) => item.instructorId && item.studentId && students.includes(item.studentId))
              .map((item) => item.instructorId as string),
          ),
        ];
        return {
          needsSquadron: operationalContextNeedsSquadronPick(context),
          kind,
          allowedKinds,
          columns: built.columns,
          rows: built.rows,
          programs: snapshot.programs.map((item) => ({ id: item.id, label: item.name })),
          promotions: promotionsInScope(context, snapshot).map((item) => ({ id: item.id, label: item.name })),
          students: students.map((id) => ({ id, label: displayUserName(id, snapshot) })),
          instructors: instructorIds.map((id) => ({ id, label: displayUserName(id, snapshot) })),
          aircraft: snapshot.aircraft
            .filter((item) => !context.unitId || item.unitId === context.unitId)
            .map((item) => ({ id: item.id, label: item.registration })),
        };
      }),
    );
  }
}

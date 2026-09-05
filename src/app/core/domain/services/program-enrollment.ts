import type { RoleCode } from '../entities/role-code';
import type {
  ProgramEnrollmentCloseInput,
  ProgramEnrollmentEntity,
  ProgramEnrollmentSource,
  ProgramEnrollmentStatus,
  ProgramEnrollmentWriteInput,
} from '../entities/admin-catalog';
import {
  PROGRAM_ENROLLMENT_CLOSE_STATUSES,
  PROGRAM_ENROLLMENT_SOURCES,
} from '../entities/admin-catalog';
import { InvalidAdminCatalogError } from '../errors/domain-error';

const ENROLL_ROLES: readonly RoleCode[] = [
  'ADSYS',
  'ADPER',
  'COMDO',
  'JESQD',
  'JOPER',
  'JINST',
  'INSTR',
];

export function canEnrollInProgram(role: RoleCode): boolean {
  return ENROLL_ROLES.includes(role);
}

export function enrollmentAllowsAcademicWrite(status: ProgramEnrollmentStatus): boolean {
  return status === 'active';
}

export function enrollmentStatusLabel(status: ProgramEnrollmentStatus): string {
  if (status === 'suspended') return 'Suspendido';
  if (status === 'withdrawn') return 'Retirado';
  if (status === 'dropped') return 'Dado de baja';
  if (status === 'completed') return 'Completado';
  return 'Activo';
}

export function assertProgramEnrollmentWrite(input: ProgramEnrollmentWriteInput): ProgramEnrollmentWriteInput {
  const programId = input.programId.trim();
  const enrolledAt = input.enrolledAt.trim();
  if (!programId) throw new InvalidAdminCatalogError('El programa es obligatorio.');
  if (!PROGRAM_ENROLLMENT_SOURCES.includes(input.source)) {
    throw new InvalidAdminCatalogError('La matrícula es por promoción o por alumno.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(enrolledAt)) {
    throw new InvalidAdminCatalogError('La fecha de matrícula no es válida.');
  }
  if (input.source === 'promotion') {
    const promotionId = input.promotionId?.trim() ?? '';
    if (!promotionId) throw new InvalidAdminCatalogError('Selecciona la promoción a matricular.');
    const selected = (input.userIds ?? []).map((id) => id.trim()).filter(Boolean);
    if (selected.length === 0) {
      throw new InvalidAdminCatalogError('Selecciona al menos un alumno de la promoción.');
    }
    return {
      programId,
      source: input.source,
      promotionId,
      userId: null,
      userIds: selected,
      enrolledAt,
    };
  }
  const userId = input.userId?.trim() ?? '';
  if (!userId) throw new InvalidAdminCatalogError('Selecciona el alumno a matricular.');
  return { programId, source: input.source, promotionId: null, userId, userIds: null, enrolledAt };
}

export function assertProgramEnrollmentClose(input: ProgramEnrollmentCloseInput): ProgramEnrollmentCloseInput {
  const closedAt = input.closedAt.trim();
  const closeReason = input.closeReason.trim();
  if (!PROGRAM_ENROLLMENT_CLOSE_STATUSES.includes(input.status)) {
    throw new InvalidAdminCatalogError('El cierre de matrícula no es válido.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(closedAt)) {
    throw new InvalidAdminCatalogError('La fecha de cierre no es válida.');
  }
  if (!closeReason) throw new InvalidAdminCatalogError('Indica el motivo de la baja.');
  return { status: input.status, closedAt, closeReason };
}

export function assertStudentCanReceiveAssignment(
  enrollments: readonly ProgramEnrollmentEntity[],
  userId: string | null,
  programId: string | null,
): void {
  if (!userId || !programId) return;
  const related = enrollments.filter((item) => item.userId === userId && item.programId === programId);
  if (related.length === 0) return;
  if (related.some((item) => enrollmentAllowsAcademicWrite(item.status))) return;
  throw new InvalidAdminCatalogError('La matrícula no admite nuevas misiones ni evaluaciones.');
}

export function assertGroundCourseIds(
  selectedIds: readonly string[],
  allowedIds: readonly string[],
): string[] {
  const allowed = new Set(allowedIds);
  const unique: string[] = [];
  for (const raw of selectedIds) {
    const id = raw.trim();
    if (!id || unique.includes(id)) continue;
    if (!allowed.has(id)) {
      throw new InvalidAdminCatalogError('Ese curso no pertenece al programa del alumno.');
    }
    unique.push(id);
  }
  return unique;
}

export function mergeStudentProgramIds(
  assignmentProgramIds: readonly string[],
  enrollmentProgramIds: readonly string[],
): string[] {
  const ids: string[] = [];
  for (const id of [...enrollmentProgramIds, ...assignmentProgramIds]) {
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function enrollmentSourceLabel(source: ProgramEnrollmentSource): string {
  return source === 'promotion' ? 'Promoción' : 'Individual';
}

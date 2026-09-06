import type { RoleCode } from '../entities/role-code';

export type MissionSignPad = 'instructor' | 'student';

const INSTRUCTOR_SIGN_ROLES: readonly RoleCode[] = [
  'ADSYS',
  'COMDO',
  'JESQD',
  'JOPER',
  'JINST',
  'INSTR',
  'EVALU',
];

export function canSignMissionPad(
  pad: MissionSignPad,
  actor: { userId: string | null; roleCode: RoleCode | null },
  assignment: { instructorId: string | null; studentId: string | null } | null,
): boolean {
  const userId = actor.userId;
  if (!userId || !assignment) return false;
  if (pad === 'student') return assignment.studentId === userId;
  if (assignment.studentId === userId) return false;
  if (assignment.instructorId === userId) return true;
  return !!actor.roleCode && INSTRUCTOR_SIGN_ROLES.includes(actor.roleCode);
}

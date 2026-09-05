import type { RoleCode } from '../entities/role-code';
import type { UserEntity, UserRoleEntity } from '../entities/admin-catalog';
import type {
  ManeuverEvaluationEntity,
  MissionExecutionStatus,
  TrainingAssignmentStatus,
} from '../entities/admin-catalog';
import { InvalidAdminCatalogError } from '../errors/domain-error';

export const DISPATCH_DAILY_SLOT_CAPACITY = 18;
export const DISPATCH_DEFAULT_BLOCK_HOURS = 1.5;

export function addClockHours(start: string, hours: number): string {
  const match = /^(\d{2}):(\d{2})$/.exec(start);
  if (!match) return start;
  const total = Number(match[1]) * 60 + Number(match[2]) + Math.round(hours * 60);
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = String(Math.floor(normalized / 60)).padStart(2, '0');
  const minute = String(normalized % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}

const DISPATCH_ROLES: readonly RoleCode[] = [
  'ADSYS',
  'ADPER',
  'COMDO',
  'JESQD',
  'JOPER',
  'JINST',
  'INSTR',
];

const LIVE_SHEET_ROLES: readonly RoleCode[] = [...DISPATCH_ROLES, 'EVALU'];

export const FLIGHT_INSTRUCTOR_ROLE_CODES: readonly RoleCode[] = ['INSTR', 'JINST'];

export type DispatchSlotKind = 'ready' | 'airborne' | 'pending' | 'closed' | 'cancelled';

export function canDispatchMission(role: RoleCode): boolean {
  return DISPATCH_ROLES.includes(role);
}

export function canOpenLiveEvaluation(role: RoleCode): boolean {
  return LIVE_SHEET_ROLES.includes(role);
}

export function assertCanDispatchMission(role: RoleCode): void {
  if (!canDispatchMission(role)) {
    throw new InvalidAdminCatalogError('Tu rol no puede despachar misiones.');
  }
}

export function shiftIsoCalendarDate(iso: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isoClockTime(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function isIsoClockTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

export function isFlightInstructor(user: UserEntity, roles: readonly UserRoleEntity[]): boolean {
  const codes = new Set(
    roles
      .filter((role): role is UserRoleEntity & { code: RoleCode } => !!role.code && user.roleIds.includes(role.id))
      .map((role) => role.code),
  );
  return FLIGHT_INSTRUCTOR_ROLE_CODES.some((code) => codes.has(code));
}

export function dispatchOccupancyPercent(assignedCount: number, capacity = DISPATCH_DAILY_SLOT_CAPACITY): number {
  if (capacity <= 0) return 0;
  return Math.round((assignedCount / capacity) * 1000) / 10;
}

export function maneuverProgressPercent(evaluations: readonly ManeuverEvaluationEntity[]): number | null {
  if (evaluations.length === 0) return null;
  const graded = evaluations.filter((item) => item.grade).length;
  return Math.round((graded / evaluations.length) * 100);
}

export function dispatchSlotKind(
  assignmentStatus: TrainingAssignmentStatus,
  executionStatus: MissionExecutionStatus | undefined,
): DispatchSlotKind {
  if (assignmentStatus === 'cancelled') return 'cancelled';
  if (executionStatus === 'completed' || assignmentStatus === 'completed') return 'closed';
  if (executionStatus === 'in-progress' || assignmentStatus === 'in-progress') return 'airborne';
  return 'pending';
}

export function markReadyDispatchSlot<T extends { kind: DispatchSlotKind; startTime: string | null; canBecomeReady: boolean }>(
  slots: readonly T[],
): T[] {
  const ranked = slots
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.kind === 'pending' && item.canBecomeReady)
    .sort((a, b) => {
      const timeA = a.item.startTime ?? '99:99';
      const timeB = b.item.startTime ?? '99:99';
      return timeA.localeCompare(timeB) || a.index - b.index;
    });
  const readyId = ranked[0]?.index;
  if (readyId === undefined) return [...slots];
  return slots.map((item, index) => (index === readyId ? { ...item, kind: 'ready' as const } : item));
}

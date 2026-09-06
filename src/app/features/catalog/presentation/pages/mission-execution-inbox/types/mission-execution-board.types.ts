export const MISSION_EXECUTION_BOARD_STATUSES = ['scheduled', 'in-progress', 'completed', 'cancelled'] as const;
export type MissionExecutionBoardStatus = (typeof MISSION_EXECUTION_BOARD_STATUSES)[number];

export const MISSION_EXECUTION_FILTERS = ['all', ...MISSION_EXECUTION_BOARD_STATUSES] as const;
export type MissionExecutionBoardFilter = (typeof MISSION_EXECUTION_FILTERS)[number];

export const MISSION_EXECUTION_ORDER_STATUSES = [
  'draft',
  'scheduled',
  'in-progress',
  'completed',
  'cancelled',
] as const;
export type MissionExecutionOrderStatus = (typeof MISSION_EXECUTION_ORDER_STATUSES)[number];

export interface MissionExecutionOrderPermit {
  number: string;
  date: string;
  status: MissionExecutionOrderStatus;
  aircraft: string;
  student: string;
  instructor: string;
  authorizer: string;
  departure: string;
  arrival: string;
  duration: string;
  observations: string;
}

export interface MissionExecutionBoardItem {
  id: string;
  executionId: string;
  code: string;
  mission: string;
  student: string;
  studentCallsign: string;
  program: string;
  phase: string;
  subphase: string;
  instructor: string;
  instructorCallsign: string;
  aircraft: string;
  time: string;
  status: MissionExecutionBoardStatus;
  progress: number;
  progressLabel: string;
  order: MissionExecutionOrderPermit;
}

export interface MissionExecutionBoardSnapshot {
  operationDate: string;
  missions: readonly MissionExecutionBoardItem[];
}

export const FIDS_TIME_CELLS = 5;
export const FIDS_CREW_CELLS = 17;
export const FIDS_AIRCRAFT_CELLS = 7;
export const FIDS_BOARDING_CELLS = 5;
export const FIDS_STATUS_CELLS = 10;
export const FIDS_SLOT_COUNT = 5;
export const FIDS_BOARD_SLOT_COUNT = FIDS_SLOT_COUNT * 2 + 12;

export function fidsPadSlots<T>(items: readonly T[], size: number): (T | null)[] {
  const next: (T | null)[] = items.slice(0, size);
  while (next.length < size) next.push(null);
  return next;
}

export function missionExecutionCrewStrip(item: Pick<MissionExecutionBoardItem, 'instructorCallsign' | 'studentCallsign'>): string {
  return `${item.studentCallsign}/${item.instructorCallsign}`.toUpperCase();
}

export function fidsPad(value: string, size: number): string[] {
  const chars = Array.from(value.toUpperCase()).slice(0, size);
  while (chars.length < size) chars.push('');
  return chars.map((ch) => (ch === ' ' ? '' : ch));
}

export function fidsOffsetTime(time: string, offsetMinutes: number): string {
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time;
  const day = 24 * 60;
  const total = (((hours * 60 + minutes + offsetMinutes) % day) + day) % day;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function fidsRemark(status: MissionExecutionBoardStatus): 'boarding' | 'closing' {
  return status === 'in-progress' ? 'closing' : 'boarding';
}

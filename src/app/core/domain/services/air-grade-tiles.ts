import type { MissionResult } from '../entities/admin-catalog';

export const AIR_GRADE_TILE_TONES = ['pass', 'regular', 'fail', 'pending'] as const;
export type AirGradeTileTone = (typeof AIR_GRADE_TILE_TONES)[number];

export const AIR_GRADE_TILE_STATUSES = [
  'pending',
  'insufficient',
  'observed',
  'regular',
  'approved',
  'outstanding',
] as const;
export type AirGradeTileStatus = (typeof AIR_GRADE_TILE_STATUSES)[number];

export const AIR_GRADE_PASS_THRESHOLD = 13;
export const AIR_GRADE_GOOD_THRESHOLD = 16;
export const AIR_GRADE_OUTSTANDING_THRESHOLD = 18;

export function airGradeTileStatus(input: {
  average: number | null;
  result: MissionResult | null;
}): AirGradeTileStatus {
  if (input.result === 'failed') return 'insufficient';
  if (input.result === 'reinforcement' || input.result === 'approved-observations') return 'observed';
  if (input.average === null) return input.result === 'approved' ? 'approved' : 'pending';
  if (input.average < AIR_GRADE_PASS_THRESHOLD) return 'insufficient';
  if (input.average < AIR_GRADE_GOOD_THRESHOLD) return 'regular';
  if (input.average >= AIR_GRADE_OUTSTANDING_THRESHOLD) return 'outstanding';
  return 'approved';
}

export function airGradeTileTone(status: AirGradeTileStatus): AirGradeTileTone {
  if (status === 'pending') return 'pending';
  if (status === 'insufficient' || status === 'observed') return 'fail';
  if (status === 'regular') return 'regular';
  return 'pass';
}

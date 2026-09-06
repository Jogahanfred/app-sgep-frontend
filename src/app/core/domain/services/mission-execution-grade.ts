import type { ManeuverGrade, MissionResult } from '../entities/admin-catalog';

export const MISSION_MANEUVER_POINTS: Record<ManeuverGrade, number> = {
  P: 0,
  D: 8,
  I: 11,
  R: 14,
  B: 17,
  E: 19,
  NC: 0,
};

export const MISSION_GRADE_SCALE: readonly ManeuverGrade[] = ['P', 'D', 'I', 'R', 'B', 'E'];

export function missionHasDangerousGrade(grades: readonly (ManeuverGrade | null | undefined)[]): boolean {
  return grades.some((grade) => grade === 'P');
}

export function missionResultFromManeuverGrades(
  grades: readonly (ManeuverGrade | null | undefined)[],
  current: MissionResult | null,
): MissionResult | null {
  if (missionHasDangerousGrade(grades)) return 'failed';
  return current === 'failed' ? null : current;
}

export function missionManeuverAverage(grades: readonly (ManeuverGrade | null | undefined)[]): number | null {
  const values = grades
    .filter((grade): grade is ManeuverGrade => !!grade)
    .map((grade) => MISSION_MANEUVER_POINTS[grade]);
  if (!values.length) return null;
  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
}

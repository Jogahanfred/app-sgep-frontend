import { DIRBE_LEVELS, type DirbeLevel, type ManeuverGrade } from '../entities/admin-catalog';

export const DIRBEP_GRADE_CODES = ['P', 'D', 'I', 'R', 'B', 'E'] as const;

export type DirbepGradeCode = (typeof DIRBEP_GRADE_CODES)[number];

export const DIRBEP_GRADE_COLOR_VARS: Record<DirbepGradeCode, string> = {
  P: 'var(--grade-p)',
  D: 'var(--grade-d)',
  I: 'var(--grade-i)',
  R: 'var(--grade-r)',
  B: 'var(--grade-b)',
  E: 'var(--grade-e)',
};

export function isDirbepGradeCode(value: string | null | undefined): value is DirbepGradeCode {
  return !!value && (DIRBEP_GRADE_CODES as readonly string[]).includes(value);
}

export function dirbepGradeTone(value: string | null | undefined): string {
  return isDirbepGradeCode(value) ? value.toLowerCase() : 'empty';
}

export function dirbepGradeChipClass(value: string | null | undefined, selected = false): string {
  const tone = dirbepGradeTone(value);
  return `grade-chip grade-chip--${tone}${selected ? ' grade-chip--on' : ''}`;
}

export function dirbeLevelDelta(
  expected: DirbeLevel | null | undefined,
  actual: ManeuverGrade | null | undefined,
): number {
  if (!expected || !actual || actual === 'NC') return 0;
  const expectedIndex = DIRBE_LEVELS.indexOf(expected);
  if (expectedIndex < 0) return 0;
  if (actual === 'P') return -(expectedIndex + 1);
  const actualIndex = DIRBE_LEVELS.indexOf(actual as DirbeLevel);
  if (actualIndex < 0) return 0;
  return actualIndex - expectedIndex;
}

export function formatDirbeLevelDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

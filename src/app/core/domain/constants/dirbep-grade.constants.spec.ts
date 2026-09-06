import {
  DIRBEP_GRADE_CODES,
  DIRBEP_GRADE_COLOR_VARS,
  dirbeLevelDelta,
  dirbepGradeChipClass,
  formatDirbeLevelDelta,
} from './dirbep-grade.constants';

describe('DIRBEP_GRADE_COLOR_VARS', () => {
  it('expone el token de color de cada letra de la escala', () => {
    expect(DIRBEP_GRADE_CODES).toEqual(['P', 'D', 'I', 'R', 'B', 'E']);
    expect(DIRBEP_GRADE_COLOR_VARS.P).toBe('var(--grade-p)');
    expect(DIRBEP_GRADE_COLOR_VARS.D).toBe('var(--grade-d)');
    expect(DIRBEP_GRADE_COLOR_VARS.I).toBe('var(--grade-i)');
    expect(DIRBEP_GRADE_COLOR_VARS.R).toBe('var(--grade-r)');
    expect(DIRBEP_GRADE_COLOR_VARS.B).toBe('var(--grade-b)');
    expect(DIRBEP_GRADE_COLOR_VARS.E).toBe('var(--grade-e)');
    expect(dirbepGradeChipClass('B', true)).toBe('grade-chip grade-chip--b grade-chip--on');
  });

  it('calcula el desvío DIRBE respecto al estándar esperado', () => {
    expect(dirbeLevelDelta('R', null)).toBe(0);
    expect(dirbeLevelDelta('R', 'I')).toBe(-1);
    expect(dirbeLevelDelta('R', 'B')).toBe(1);
    expect(dirbeLevelDelta('R', 'R')).toBe(0);
    expect(formatDirbeLevelDelta(-1)).toBe('-1');
    expect(formatDirbeLevelDelta(1)).toBe('+1');
    expect(formatDirbeLevelDelta(0)).toBe('0');
  });
});

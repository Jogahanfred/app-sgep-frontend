import { describe, expect, it } from 'vitest';
import {
  GROUND_ASSESSMENT_LABEL,
  GROUND_PERIODIC_EXAMS,
  applyGroundAssessmentGrade,
  applyLateExamFactor,
  sanitizeGroundGradeInput,
  courseGradeNct,
  formatGroundInstructionHint,
  groundAssessmentCompleted,
  groundAssessmentScore,
  groundRunningAverage,
  groundSheetCode,
  groundSubjectSyllabus,
  neiGrade,
  nitGrade,
  programFinalGrade,
  subjectGrade,
} from './ground-instruction-grade';

describe('calificación de instrucción en tierra', () => {
  it('declara las fórmulas del programa 2023', () => {
    const hint = formatGroundInstructionHint();
    expect(hint).toContain('NIT = NCT (0,8) + NEI (0,2)');
    expect(hint).toContain('NA = PE (0,6) + PT (0,4)');
    expect(hint).toContain('NFPI = NIT (0,2) + NIA (0,8)');
    expect(hint).toContain('promedio simple');
  });

  it('calcula NA, NCT, NEI, NIT y NFPI', () => {
    const na = subjectGrade(18, 16);
    expect(na).toBeCloseTo(17.2, 5);
    const nct = courseGradeNct([{ grade: na, coefficient: 0.22 }]);
    expect(nct).toBeCloseTo(3.784, 5);
    const nei = neiGrade([
      { score: 16, countsTowardNei: true },
      { score: 18, countsTowardNei: true },
      { score: 20, countsTowardNei: false },
    ]);
    expect(nei).toBe(17);
    const nit = nitGrade(16, 18);
    expect(nit).toBeCloseTo(16.4, 5);
    expect(programFinalGrade(16, 18)).toBeCloseTo(17.6, 5);
  });

  it('aplica el 50 % a un examen rezagado injustificado', () => {
    expect(applyLateExamFactor(16, true)).toBe(8);
    expect(applyLateExamFactor(16, false)).toBe(16);
  });

  it('pondera en NEI solo mensuales, semestrales e inopinados', () => {
    const neiExams = GROUND_PERIODIC_EXAMS.filter((item) => item.countsTowardNei);
    expect(neiExams.every((item) => item.neiWeight === 1)).toBe(true);
    expect(GROUND_PERIODIC_EXAMS.filter((item) => !item.countsTowardNei).every((item) => item.neiWeight === 0)).toBe(
      true,
    );
    expect(neiExams.map((item) => item.exam)).toEqual([
      'Ingeniería',
      'Adoctrinamiento',
      'Instrumentos',
      'Aerodinámica',
      'Meteorología',
      'Fraseología aeronáutica',
      'Examen inopinado',
    ]);
  });

  it('arma un decalaje distinto por asignatura', () => {
    expect(groundSubjectSyllabus('TEA').map((item) => item.name)).toEqual([
      'Práctica 1',
      'Práctica 2',
      'Exposición',
      'Parcial',
      'Examen Final',
    ]);
    expect(groundSubjectSyllabus('MEA').map((item) => item.name)).toContain('Taller de METAR/TAF');
    expect(groundSubjectSyllabus('AERO').map((item) => item.name)).toEqual([
      `${GROUND_ASSESSMENT_LABEL.test} 1`,
      `${GROUND_ASSESSMENT_LABEL.test} 2`,
      GROUND_ASSESSMENT_LABEL.oral,
      GROUND_ASSESSMENT_LABEL.partial,
      GROUND_ASSESSMENT_LABEL.final,
    ]);
    expect(groundSubjectSyllabus('MAT').map((item) => item.name)).toEqual([
      `${GROUND_ASSESSMENT_LABEL.exam} 1`,
      `${GROUND_ASSESSMENT_LABEL.exam} 2`,
      GROUND_ASSESSMENT_LABEL.partial,
      GROUND_ASSESSMENT_LABEL.final,
      GROUND_ASSESSMENT_LABEL.talk,
    ]);
    expect(groundSubjectSyllabus('ING').map((item) => item.name)).toEqual([
      `${GROUND_ASSESSMENT_LABEL.exam} 1`,
      `${GROUND_ASSESSMENT_LABEL.exam} 2`,
      GROUND_ASSESSMENT_LABEL.partial,
      GROUND_ASSESSMENT_LABEL.final,
    ]);
    expect(groundSubjectSyllabus('HIST').map((item) => item.name)).toEqual([
      GROUND_ASSESSMENT_LABEL.talk,
      GROUND_ASSESSMENT_LABEL.partial,
      GROUND_ASSESSMENT_LABEL.final,
    ]);
    expect(groundAssessmentCompleted(1, 5, true)).toBe(true);
    expect(groundAssessmentCompleted(5, 5, false)).toBe(false);
    expect(groundAssessmentScore('aero-t1')).toBeGreaterThanOrEqual(16);
    expect(groundAssessmentScore('aero-t1')).toBeLessThanOrEqual(20);
  });

  it('registra una nota y desbloquea la siguiente evaluación', () => {
    const syllabus = groundSubjectSyllabus('OPV');
    const next = applyGroundAssessmentGrade(
      [
        { courseId: 'sp-ppl-opv', code: 'P1', status: 'completed', grade: 15 },
        { courseId: 'sp-ppl-opv', code: 'P2', status: 'completed', grade: 14 },
        { courseId: 'sp-ppl-opv', code: 'GRP', status: 'completed', grade: 17 },
        { courseId: 'sp-ppl-opv', code: 'PAR', status: 'available', grade: null },
        { courseId: 'sp-ppl-opv', code: 'FIN', status: 'blocked', grade: null },
      ],
      'sp-ppl-opv',
      syllabus,
      'PAR',
      16,
    );
    expect(next.find((item) => item.code === 'PAR')).toEqual({
      courseId: 'sp-ppl-opv',
      code: 'PAR',
      status: 'completed',
      grade: 16,
    });
    expect(next.find((item) => item.code === 'FIN')?.status).toBe('available');
  });

  it('permite calificar cualquier casilla del acta y calcula el promedio parcial', () => {
    const syllabus = groundSubjectSyllabus('OPV');
    expect(syllabus.map((_, index) => groundSheetCode(syllabus, index))).toEqual(['TB1', 'TB2', 'TB3', 'EP', 'EX']);
    const next = applyGroundAssessmentGrade([], 'sp-ppl-opv', syllabus, 'FIN', 18);
    expect(next.find((item) => item.code === 'FIN')).toMatchObject({ status: 'completed', grade: 18 });
    expect(groundRunningAverage([15, 14, null, 16])).toBe(15);
    expect(groundRunningAverage([null, null])).toBeNull();
  });

  it('deja escribir solo notas numéricas entre 0 y 20', () => {
    expect(sanitizeGroundGradeInput('ab')).toBe('');
    expect(sanitizeGroundGradeInput('18a')).toBe('18');
    expect(sanitizeGroundGradeInput('21')).toBe('20');
    expect(sanitizeGroundGradeInput('20.1')).toBe('20');
    expect(sanitizeGroundGradeInput('19,5')).toBe('19.5');
    expect(sanitizeGroundGradeInput('19.55')).toBe('19.5');
    expect(sanitizeGroundGradeInput('20.')).toBe('20.');
  });
});

import { describe, expect, it } from 'vitest';
import {
  GROUND_ASSESSMENT_LABEL,
  GROUND_PERIODIC_EXAMS,
  applyLateExamFactor,
  courseGradeNct,
  formatGroundInstructionHint,
  groundAssessmentCompleted,
  groundAssessmentScore,
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
});

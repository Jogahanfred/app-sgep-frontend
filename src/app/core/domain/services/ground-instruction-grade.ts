import { InvalidAdminCatalogError } from '../errors/domain-error';
import type {
  GroundEvaluationRecord,
  GroundPeriodicExamKind,
  GroundPeriodicExamRule,
} from '../entities/admin-catalog';

export const GROUND_PROGRAM_WEIGHT = {
  nit: 0.2,
  nia: 0.8,
} as const;

export const GROUND_NIT_WEIGHT = {
  nct: 0.8,
  nei: 0.2,
} as const;

export const GROUND_SUBJECT_WEIGHT = {
  examAverage: 0.6,
  testAverage: 0.4,
} as const;

export const GROUND_UNJUSTIFIED_ABSENCE_FACTOR = 0.5 as const;

export const GROUND_ASSESSMENT_KIND = ['test', 'exam', 'oral', 'partial', 'final', 'talk'] as const;
export type GroundAssessmentKind = (typeof GROUND_ASSESSMENT_KIND)[number];

export const GROUND_ASSESSMENT_LABEL = {
  test: 'Trabajo',
  exam: 'Examen',
  oral: 'Orales',
  partial: 'Trabajo Parcial',
  final: 'Trabajo Final',
  talk: 'Exposición',
} as const;

export const GROUND_DEMO_GRADE_MIN = 16;
export const GROUND_DEMO_GRADE_SPAN = 5;
export const GROUND_IN_PROGRESS_COMPLETED_RATIO = 0.6;

export interface GroundSyllabusItem {
  code: string;
  name: string;
  kind: GroundAssessmentKind;
}

function numberedAssessment(kind: 'test' | 'exam', index: number): GroundSyllabusItem {
  const prefix = kind === 'test' ? 'T' : 'EX';
  return {
    code: `${prefix}-${index}`,
    name: `${GROUND_ASSESSMENT_LABEL[kind]} ${index}`,
    kind,
  };
}

function namedAssessment(kind: 'oral' | 'partial' | 'final' | 'talk', code: string): GroundSyllabusItem {
  return { code, name: GROUND_ASSESSMENT_LABEL[kind], kind };
}

function item(code: string, name: string, kind: GroundAssessmentKind): GroundSyllabusItem {
  return { code, name, kind };
}

const PPL_GROUND_SYLLABUS: Readonly<Record<string, readonly GroundSyllabusItem[]>> = {
  TEA: [
    item('P1', 'Práctica 1', 'test'),
    item('P2', 'Práctica 2', 'test'),
    item('EXP', 'Exposición', 'talk'),
    item('PAR', 'Parcial', 'partial'),
    item('FIN', 'Examen Final', 'final'),
  ],
  MEA: [
    item('P1', 'Práctica 1', 'test'),
    item('TAF', 'Taller de METAR/TAF', 'exam'),
    item('EXP', 'Exposición', 'talk'),
    item('PAR', 'Parcial', 'partial'),
    item('FIN', 'Examen Final', 'final'),
  ],
  NVA: [
    item('P1', 'Práctica 1', 'test'),
    item('P2', 'Práctica 2', 'test'),
    item('NAV', 'Trabajo de navegación', 'test'),
    item('PAR', 'Parcial', 'partial'),
    item('FIN', 'Examen Final', 'final'),
  ],
  RGA: [
    item('P1', 'Práctica 1', 'test'),
    item('CAS', 'Análisis de caso', 'exam'),
    item('EXP', 'Exposición', 'talk'),
    item('PAR', 'Parcial', 'partial'),
    item('FIN', 'Examen Final', 'final'),
  ],
  OPV: [
    item('P1', 'Práctica 1', 'test'),
    item('P2', 'Práctica 2', 'test'),
    item('GRP', 'Trabajo grupal', 'test'),
    item('PAR', 'Parcial', 'partial'),
    item('FIN', 'Examen Final', 'final'),
  ],
  PRF: [
    item('P1', 'Práctica 1', 'test'),
    item('P2', 'Práctica 2', 'test'),
    item('SIM', 'Simulación', 'exam'),
    item('FIN', 'Examen Final', 'final'),
  ],
  SMF: [
    item('S1', 'Simulación 1', 'exam'),
    item('S2', 'Simulación 2', 'exam'),
    item('EMG', 'Emergencias', 'exam'),
    item('FIN', 'Evaluación Final', 'final'),
  ],
  ETF: [
    item('V1', 'Vuelo 1', 'exam'),
    item('V2', 'Vuelo 2', 'exam'),
    item('MAN', 'Maniobras', 'exam'),
    item('PRC', 'Evaluación práctica', 'final'),
  ],
  EIN: [
    item('TEO', 'Examen Teórico', 'exam'),
    item('PRA', 'Examen Práctico', 'exam'),
    item('FIN', 'Evaluación Final', 'final'),
  ],
};

const SYLLABUS_BY_BANK_CODE: Readonly<Record<string, readonly GroundSyllabusItem[]>> = {
  ...PPL_GROUND_SYLLABUS,
  AERO: [
    numberedAssessment('test', 1),
    numberedAssessment('test', 2),
    namedAssessment('oral', 'ORAL'),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
  MAT: [
    numberedAssessment('exam', 1),
    numberedAssessment('exam', 2),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
    namedAssessment('talk', 'EXP'),
  ],
  FIS: [
    numberedAssessment('test', 1),
    numberedAssessment('test', 2),
    namedAssessment('oral', 'ORAL'),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
  QUI: [
    numberedAssessment('exam', 1),
    namedAssessment('oral', 'ORAL'),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
    namedAssessment('talk', 'EXP'),
  ],
  ING: [
    numberedAssessment('exam', 1),
    numberedAssessment('exam', 2),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
  ADOC: [
    numberedAssessment('test', 1),
    numberedAssessment('exam', 1),
    namedAssessment('oral', 'ORAL'),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
  LIM: [
    numberedAssessment('exam', 1),
    numberedAssessment('exam', 2),
    namedAssessment('oral', 'ORAL'),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
  PE: [
    numberedAssessment('exam', 1),
    numberedAssessment('exam', 2),
    namedAssessment('oral', 'ORAL'),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
  MET: [
    numberedAssessment('test', 1),
    numberedAssessment('exam', 1),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
  PREV: [
    numberedAssessment('test', 1),
    numberedAssessment('exam', 1),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
  NORM: [
    numberedAssessment('test', 1),
    numberedAssessment('exam', 1),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
  RAP: [
    numberedAssessment('test', 1),
    numberedAssessment('exam', 1),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
  FRA: [
    numberedAssessment('test', 1),
    numberedAssessment('exam', 1),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
  BAL: [numberedAssessment('exam', 1), numberedAssessment('exam', 2), namedAssessment('final', 'FIN')],
  PN: [
    numberedAssessment('test', 1),
    numberedAssessment('exam', 1),
    namedAssessment('partial', 'PAR'),
    namedAssessment('final', 'FIN'),
  ],
};

const ADOCTRINE_SYLLABUS: readonly GroundSyllabusItem[] = [
  numberedAssessment('exam', 1),
  namedAssessment('oral', 'ORAL'),
  namedAssessment('final', 'FIN'),
];

const CONFERENCE_SYLLABUS: readonly GroundSyllabusItem[] = [
  namedAssessment('talk', 'EXP'),
  namedAssessment('partial', 'PAR'),
  namedAssessment('final', 'FIN'),
];

export function groundSubjectSyllabus(bankCode: string): readonly GroundSyllabusItem[] {
  const code = bankCode.trim().toUpperCase();
  if (SYLLABUS_BY_BANK_CODE[code]) return SYLLABUS_BY_BANK_CODE[code];
  if (code.startsWith('AD-')) return ADOCTRINE_SYLLABUS;
  return CONFERENCE_SYLLABUS;
}

export function groundAssessmentCompleted(
  index: number,
  total: number,
  programCulminated: boolean,
): boolean {
  if (programCulminated) return true;
  const cutoff = Math.max(1, Math.ceil(total * GROUND_IN_PROGRESS_COMPLETED_RATIO));
  return index <= cutoff;
}

export function groundAssessmentScore(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % GROUND_DEMO_GRADE_SPAN;
  }
  return GROUND_DEMO_GRADE_MIN + hash;
}

function exam(
  id: string,
  period: string,
  name: string,
  kind: GroundPeriodicExamKind,
  minPassingGrade: number,
  countsTowardNei: boolean,
): GroundPeriodicExamRule {
  return {
    id,
    period,
    exam: name,
    kind,
    minPassingGrade,
    countsTowardNei,
    neiWeight: countsTowardNei ? 1 : 0,
  };
}

/**
 * Test y exámenes del programa 2023. NEI es el promedio simple de las notas
 * mensuales, semestrales e inopinadas. Semanales y quincenales rigen progresión
 * (nota mínima) y no entran en ese promedio.
 */
export const GROUND_PERIODIC_EXAMS: readonly GroundPeriodicExamRule[] = [
  exam('weekly-crit', 'Semanalmente', 'Emergencias críticas', 'weekly', 20, false),
  exam('biweekly-noncrit', 'Quincenalmente', 'Emergencias no críticas', 'biweekly', 20, false),
  exam('biweekly-limits', 'Quincenalmente', 'Límites de operación', 'biweekly', 20, false),
  exam('monthly-eng', 'Mensualmente', 'Ingeniería', 'monthly', 16, true),
  exam('monthly-doctrine', 'Mensualmente', 'Adoctrinamiento', 'monthly', 18, true),
  exam('semester-instruments', 'Semestralmente', 'Instrumentos', 'semester', 16, true),
  exam('semester-aero', 'Semestralmente', 'Aerodinámica', 'semester', 16, true),
  exam('semester-meteo', 'Semestralmente', 'Meteorología', 'semester', 16, true),
  exam('semester-phrase', 'Semestralmente', 'Fraseología aeronáutica', 'semester', 16, true),
  exam('unannounced', 'Inopinado', 'Examen inopinado', 'unannounced', 16, true),
];

export function formatGroundDecimal(value: number): string {
  return String(value).replace('.', ',');
}

export function formatGroundInstructionHint(): string {
  return [
    `NFPI = NIT (${formatGroundDecimal(GROUND_PROGRAM_WEIGHT.nit)}) + NIA (${formatGroundDecimal(GROUND_PROGRAM_WEIGHT.nia)}).`,
    `NIT = NCT (${formatGroundDecimal(GROUND_NIT_WEIGHT.nct)}) + NEI (${formatGroundDecimal(GROUND_NIT_WEIGHT.nei)}).`,
    'NCT = suma de (nota de asignatura × coeficiente).',
    `NA = PE (${formatGroundDecimal(GROUND_SUBJECT_WEIGHT.examAverage)}) + PT (${formatGroundDecimal(GROUND_SUBJECT_WEIGHT.testAverage)}).`,
    'NEI = promedio simple de exámenes mensuales, semestrales e inopinados.',
  ].join(' ');
}

export function subjectGrade(examAverage: number, testAverage: number): number {
  return examAverage * GROUND_SUBJECT_WEIGHT.examAverage + testAverage * GROUND_SUBJECT_WEIGHT.testAverage;
}

export function courseGradeNct(items: readonly { grade: number; coefficient: number }[]): number {
  return items.reduce((total, item) => total + item.grade * item.coefficient, 0);
}

export function neiGrade(scores: readonly { score: number; countsTowardNei: boolean; weight?: number }[]): number | null {
  const eligible = scores.filter((item) => item.countsTowardNei);
  if (!eligible.length) return null;
  const totalWeight = eligible.reduce((total, item) => total + (item.weight ?? 1), 0);
  if (totalWeight <= 0) return null;
  return eligible.reduce((total, item) => total + item.score * (item.weight ?? 1), 0) / totalWeight;
}

export function nitGrade(nct: number, nei: number): number {
  return nct * GROUND_NIT_WEIGHT.nct + nei * GROUND_NIT_WEIGHT.nei;
}

export function programFinalGrade(nit: number, nia: number): number {
  return nit * GROUND_PROGRAM_WEIGHT.nit + nia * GROUND_PROGRAM_WEIGHT.nia;
}

export function applyLateExamFactor(score: number, unjustifiedAbsence: boolean): number {
  return unjustifiedAbsence ? score * GROUND_UNJUSTIFIED_ABSENCE_FACTOR : score;
}

export function assertGroundNumericGrade(grade: number): number {
  if (!Number.isFinite(grade) || grade < 0 || grade > 20) {
    throw new InvalidAdminCatalogError('La nota debe estar entre 0 y 20.');
  }
  return Math.round(grade * 10) / 10;
}

export function sanitizeGroundGradeInput(raw: string): string {
  let integer = '';
  let fraction = '';
  let hasSeparator = false;
  for (const char of raw.replace(',', '.')) {
    if (char >= '0' && char <= '9') {
      if (hasSeparator) {
        if (fraction.length < 1) fraction += char;
      } else {
        integer += char;
      }
    } else if (char === '.' && !hasSeparator) {
      hasSeparator = true;
    }
  }
  integer = integer.replace(/^0+(?=\d)/, '');
  if (!integer && (hasSeparator || fraction)) integer = '0';
  if (!integer && !hasSeparator) return '';
  const numeric = Number(fraction ? `${integer}.${fraction}` : integer);
  if (Number.isFinite(numeric) && numeric > 20) return '20';
  return hasSeparator ? `${integer}.${fraction}` : integer;
}

export function groundCourseRecords(
  existing: readonly GroundEvaluationRecord[],
  courseId: string,
  syllabus: readonly GroundSyllabusItem[],
): GroundEvaluationRecord[] {
  const byCode = new Map(existing.filter((item) => item.courseId === courseId).map((item) => [item.code, item]));
  return syllabus.map((item) => {
    const recorded = byCode.get(item.code);
    if (recorded) return recorded;
    return { courseId, code: item.code, status: 'available', grade: null };
  });
}

export function groundSheetCode(syllabus: readonly GroundSyllabusItem[], index: number): string {
  const item = syllabus[index];
  if (!item) return '';
  const hasExam = syllabus.some((entry) => entry.kind === 'exam');
  if (item.kind === 'test') {
    return `TB${syllabus.filter((entry, offset) => offset <= index && entry.kind === 'test').length}`;
  }
  if (item.kind === 'exam') {
    const count = syllabus.filter((entry, offset) => offset <= index && entry.kind === 'exam').length;
    return count === 1 ? 'EP' : `EP${count}`;
  }
  if (item.kind === 'partial') return hasExam ? 'PP' : 'EP';
  if (item.kind === 'final') return 'EX';
  if (item.kind === 'talk') return 'EXP';
  if (item.kind === 'oral') return 'OR';
  return item.code;
}

export function groundRunningAverage(grades: readonly (number | null | undefined)[]): number | null {
  const values = grades.filter((value): value is number => value !== null && value !== undefined && Number.isFinite(value));
  if (!values.length) return null;
  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
}

export function applyGroundAssessmentGrade(
  existing: readonly GroundEvaluationRecord[],
  courseId: string,
  syllabus: readonly GroundSyllabusItem[],
  code: string,
  grade: number,
): GroundEvaluationRecord[] {
  const value = assertGroundNumericGrade(grade);
  const index = syllabus.findIndex((item) => item.code === code);
  if (index < 0) {
    throw new InvalidAdminCatalogError('Esa evaluación no pertenece al curso.');
  }
  const course = groundCourseRecords(existing, courseId, syllabus);
  const nextCode = syllabus[index + 1]?.code;
  const updated = course.map((item) => {
    if (item.code === code) return { ...item, status: 'completed' as const, grade: value };
    if (nextCode && item.code === nextCode && item.status === 'blocked') {
      return { ...item, status: 'available' as const };
    }
    return item;
  });
  return [...existing.filter((item) => item.courseId !== courseId), ...updated];
}

export function academicCodeFromName(name: string): string {
  const compact = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
  return compact.length >= 2 ? compact : 'ASIG';
}

export function periodicExamKindFromPeriod(period: string): GroundPeriodicExamKind {
  const value = period.trim().toLowerCase();
  if (value.includes('semanal')) return 'weekly';
  if (value.includes('quincen')) return 'biweekly';
  if (value.includes('mensual')) return 'monthly';
  if (value.includes('semestr')) return 'semester';
  return 'unannounced';
}

export function assertGroundPeriodicExams(
  items: readonly GroundPeriodicExamRule[] | undefined,
): GroundPeriodicExamRule[] {
  if (!items?.length) return [];
  return items.map((item, index) => {
    const period = item.period.trim();
    const examName = item.exam.trim();
    const minPassingGrade = Number(item.minPassingGrade);
    const neiWeight = Number(item.neiWeight);
    if (!period || !examName) {
      throw new InvalidAdminCatalogError('Cada test periódico necesita periodo y nombre.');
    }
    if (!Number.isFinite(minPassingGrade) || minPassingGrade < 0 || minPassingGrade > 20) {
      throw new InvalidAdminCatalogError('La nota mínima del test periódico debe estar entre 0 y 20.');
    }
    if (!Number.isFinite(neiWeight) || neiWeight < 0 || neiWeight > 1) {
      throw new InvalidAdminCatalogError('El ponderado NEI debe estar entre 0 y 1.');
    }
    const countsTowardNei = neiWeight > 0;
    return {
      id: item.id.trim() || `periodic-${index + 1}`,
      period,
      exam: examName,
      kind: item.kind || periodicExamKindFromPeriod(period),
      minPassingGrade,
      countsTowardNei,
      neiWeight: countsTowardNei ? neiWeight : 0,
    };
  });
}

export type { GroundPeriodicExamKind, GroundPeriodicExamRule };

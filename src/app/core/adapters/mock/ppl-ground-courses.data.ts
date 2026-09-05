import type { GroundEvaluationRecord, SubphaseBankEntity, SubphaseEntity } from '../../domain/entities/admin-catalog';

function bank(
  id: string,
  code: string,
  name: string,
  description: string,
): SubphaseBankEntity {
  return { id, code, name, description, status: 'active', minPassingGrade: 11 };
}

function course(id: string, bankId: string, hours: number, sortOrder: number): SubphaseEntity {
  return {
    id,
    phaseId: 'ph-ppl-teo',
    subphaseBankId: bankId,
    hours,
    missionMode: 'manual',
    missionTypeIds: [],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: [],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: [],
    sortOrder,
  };
}

function done(courseId: string, code: string, grade: number): GroundEvaluationRecord {
  return { courseId, code, status: 'completed', grade };
}

function pending(courseId: string, code: string): GroundEvaluationRecord {
  return { courseId, code, status: 'available', grade: null };
}

function locked(courseId: string, code: string): GroundEvaluationRecord {
  return { courseId, code, status: 'blocked', grade: null };
}

export const PPL_GROUND_SUBPHASE_BANKS: SubphaseBankEntity[] = [
  bank('sb-ppl-tea', 'TEA', 'Teoría Aeronáutica I', 'Fundamentos de teoría aeronáutica.'),
  bank('sb-ppl-mea', 'MEA', 'Meteorología Aeronáutica', 'Meteorología aplicada a la operación aérea.'),
  bank('sb-ppl-nva', 'NVA', 'Navegación Aérea', 'Planificación y navegación visual.'),
  bank('sb-ppl-rga', 'RGA', 'Reglamentación Aeronáutica', 'Normativa y análisis de casos.'),
  bank('sb-ppl-opv', 'OPV', 'Operaciones de Vuelo', 'Organización y trabajo de operaciones.'),
  bank('sb-ppl-prf', 'PRF', 'Procedimientos de Vuelo', 'Procedimientos y simulación de cabina.'),
  bank('sb-ppl-smf', 'SMF', 'Simulador de Vuelo', 'Sesiones de simulador y emergencias.'),
  bank('sb-ppl-etf', 'ETF', 'Entrenamiento de Vuelo', 'Vuelos y maniobras de entrenamiento.'),
  bank('sb-ppl-ein', 'EIN', 'Evaluación Integral', 'Exámenes teórico, práctico y final.'),
];

export const PPL_GROUND_SUBPHASES: SubphaseEntity[] = [
  course('sp-ppl-tea', 'sb-ppl-tea', 20, 1),
  course('sp-ppl-mea', 'sb-ppl-mea', 18, 2),
  course('sp-ppl-nva', 'sb-ppl-nva', 18, 3),
  course('sp-ppl-rga', 'sb-ppl-rga', 16, 4),
  course('sp-ppl-opv', 'sb-ppl-opv', 16, 5),
  course('sp-ppl-prf', 'sb-ppl-prf', 14, 6),
  course('sp-ppl-smf', 'sb-ppl-smf', 12, 7),
  course('sp-ppl-etf', 'sb-ppl-etf', 12, 8),
  course('sp-ppl-ein', 'sb-ppl-ein', 8, 9),
];

export const PPL_ENABLED_GROUND_COURSE_IDS = [
  'sp-ppl-tea',
  'sp-ppl-mea',
  'sp-ppl-nva',
  'sp-ppl-rga',
  'sp-ppl-opv',
] as const;

export function pplGroundEvaluations(): GroundEvaluationRecord[] {
  const tea = 'sp-ppl-tea';
  const mea = 'sp-ppl-mea';
  const nva = 'sp-ppl-nva';
  const rga = 'sp-ppl-rga';
  const opv = 'sp-ppl-opv';
  return [
    done(tea, 'P1', 16),
    done(tea, 'P2', 15),
    done(tea, 'EXP', 17),
    done(tea, 'PAR', 14),
    done(tea, 'FIN', 16),
    done(mea, 'P1', 15),
    done(mea, 'TAF', 17),
    done(mea, 'EXP', 16),
    done(mea, 'PAR', 13),
    done(mea, 'FIN', 15),
    done(nva, 'P1', 14),
    done(nva, 'P2', 16),
    done(nva, 'NAV', 15),
    done(nva, 'PAR', 14),
    done(nva, 'FIN', 16),
    done(rga, 'P1', 17),
    done(rga, 'CAS', 15),
    done(rga, 'EXP', 16),
    done(rga, 'PAR', 14),
    done(rga, 'FIN', 15),
    done(opv, 'P1', 15),
    done(opv, 'P2', 14),
    done(opv, 'GRP', 17),
    pending(opv, 'PAR'),
    locked(opv, 'FIN'),
  ];
}

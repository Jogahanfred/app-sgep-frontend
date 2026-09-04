import type {
  DirbeLevel,
  ManeuverBankEntity,
  MissionTypeEntity,
  OperationEntity,
  PhaseBankEntity,
  PhaseEntity,
  ProgramEntity,
  SubphaseBankEntity,
  SubphaseEntity,
} from '../../domain/entities/admin-catalog';
import { catalogMissionKey } from '../../domain/services/admin-catalog';

interface MissionSeed {
  id: string;
  code: string;
  name: string;
  hours: number;
  subphase: string;
}

interface SubphaseSeed {
  id: string;
  phaseId: string;
  subphaseBankId: string;
  hours: number;
  missions: readonly MissionSeed[];
  maneuverIds: readonly string[];
  sortOrder: number;
}

const operationId = {
  ground: 'op-heli-ground',
  air: 'op-heli-air',
  emergency: 'op-heli-emergency',
  navigation: 'op-heli-navigation',
  formation: 'op-heli-formation',
  special: 'op-heli-special',
  general: 'op-heli-general',
} as const;

const maneuverId = {
  briefing: 'man-heli-briefing',
  inspection: 'man-heli-inspection',
  start: 'man-heli-start',
  systems: 'man-heli-systems',
  shutdown: 'man-heli-shutdown',
  hoverTakeoff: 'man-heli-hover-takeoff',
  hover: 'man-heli-hover',
  airTaxiFormation: 'man-heli-air-taxi-formation',
  formationTakeoff: 'man-heli-formation-takeoff',
  climb: 'man-heli-climb',
  straightLevel: 'man-heli-straight-level',
  formationApproach: 'man-heli-formation-approach',
  landing: 'man-heli-landing',
  echelon: 'man-heli-echelon',
  column: 'man-heli-column',
  combatFormation: 'man-heli-combat-formation',
  mutualSupport: 'man-heli-mutual-support',
  formationTurns: 'man-heli-formation-turns',
  positionChange: 'man-heli-position-change',
  breakRejoin: 'man-heli-break-rejoin',
  lostSight: 'man-heli-lost-sight',
  leaderChange: 'man-heli-leader-change',
  wingman: 'man-heli-wingman',
  areaClearance: 'man-heli-area-clearance',
  inflightChecks: 'man-heli-inflight-checks',
  radio: 'man-heli-radio',
  planning: 'man-heli-planning',
  knowledge: 'man-heli-knowledge',
  safety: 'man-heli-safety',
  judgment: 'man-heli-judgment',
  autorotation: 'man-heli-autorotation',
  engineFailureHover: 'man-heli-engine-failure-hover',
  engineFailureFlight: 'man-heli-engine-failure-flight',
  instrument: 'man-heli-instrument',
  holding: 'man-heli-holding',
  navigation: 'man-heli-navigation',
  confinedField: 'man-heli-confined-field',
  externalLoad: 'man-heli-external-load',
  search: 'man-heli-search',
  rescue: 'man-heli-rescue',
  insertion: 'man-heli-insertion',
  nvg: 'man-heli-nvg',
  tacticalNavigation: 'man-heli-tactical-navigation',
  operationsOrder: 'man-heli-operations-order',
} as const;

function mission(
  id: string,
  code: string,
  name: string,
  hours: number,
  subphase: string,
): MissionSeed {
  return { id: `mt-heli-${id}`, code, name, hours, subphase };
}

function series(
  idPrefix: string,
  codePrefix: string,
  label: string,
  durations: readonly number[],
): MissionSeed[] {
  return durations.map((hours, index) => {
    const number = index + 1;
    return mission(
      `${idPrefix}-${String(number).padStart(2, '0')}`,
      `${codePrefix}-${number}`,
      `${label} ${number}`,
      hours,
      label,
    );
  });
}

/**
 * Transcripción operativa de la tabla "Curso de Especialidad Piloto de Helicóptero"
 * incluida en el programa 2023. Se conservan todos los códigos visibles para que el
 * recorrido del módulo sea verificable. La tabla declara 105 misiones, pero muestra
 * 107 códigos distintos: Nocturno declara 5 y lista N-1 a N-7. Además, los tiempos
 * visibles de NTN suman 7,8 h aunque el total de la subfase figura como 8,0 h.
 */
const missions = {
  contact: series(
    'c',
    'C',
    'Contacto',
    [1, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1, 1, 1, 1],
  ),
  checkSolo: [
    mission('chs-01', 'CHS-1', 'Chequeo solo 1', 0.5, 'Chequeo solo'),
    mission('solo', 'SOLO', 'Salida solo', 0.5, 'Chequeo solo'),
  ],
  emergencies: series('e', 'E', 'Emergencias', Array(8).fill(1.5)),
  instruments: series(
    'ni',
    'N/I',
    'Navegación instrumentos',
    [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1],
  ),
  formation: series('f', 'F', 'Formación', Array(5).fill(1)),
  night: series('n', 'N', 'Nocturno', [1, 1, 0.8, 0.8, 0.8, 0.8, 0.8]),
  confined: series('cx', 'CX', 'Campos extraños', Array(8).fill(1.5)),
  externalLoad: series('ce', 'CE', 'Carga externa', [1, 1, 0.8, 0.8, 0.8, 0.8, 0.8]),
  sar: series('sar', 'SAR', 'Búsqueda y rescate', Array(7).fill(1)),
  specialOperations: series('oeh', 'OEH', 'Operaciones especiales', Array(7).fill(1)),
  nvg: series('nvg', 'NVG', 'Visores nocturnos', [1, 1, 1.2, 1.2, 1.2, 1.2, 1.2]),
  tacticalFormation: series('ft', 'FT', 'Formación táctica', Array(5).fill(1)),
  tacticalDay: series('ntd', 'NTD', 'Navegación táctica diurna', [1.2, 1.2, 1.2, 1.2, 1.2, 1, 1, 1]),
  tacticalNvg: series('ntn', 'NTN', 'Navegación táctica NVG', [1.2, 1.2, 1.2, 1.2, 1, 1, 1]),
  operationsOrder: series('oo', 'O/O', 'Orden de operaciones', [1, 1]),
  completion: series('cf', 'CF', 'Complemento de fase', Array(5).fill(1)),
} as const;

const allMissions: MissionSeed[] = Object.values(missions).flatMap((items) => [...items]);

export const HELICOPTER_SOURCE_SUMMARY = {
  sourceYear: 2023,
  declaredMissionCount: 105,
  loadedMissionCount: allMissions.length,
  visibleMissionHours: 119.8,
  totalFlightHours: 120,
} as const;

export const HELICOPTER_OPERATIONS: OperationEntity[] = [
  {
    id: operationId.ground,
    name: 'Operación en tierra',
    description: 'Preparación, inspección, arranque, chequeos y cierre de la misión.',
    status: 'active',
  },
  {
    id: operationId.air,
    name: 'Operación en el aire',
    description: 'Control básico, vuelo estacionario, traslación, aproximación y aterrizaje.',
    status: 'active',
  },
  {
    id: operationId.emergency,
    name: 'Emergencias de helicóptero',
    description: 'Fallas simuladas, autorrotación y procedimientos de contingencia.',
    status: 'active',
  },
  {
    id: operationId.navigation,
    name: 'Navegación e instrumentos',
    description: 'Navegación visual, instrumentos, operación nocturna y NVG.',
    status: 'active',
  },
  {
    id: operationId.formation,
    name: 'Formación',
    description: 'Maniobras como guía o alero y coordinación de patrulla.',
    status: 'active',
  },
  {
    id: operationId.special,
    name: 'Operaciones especiales',
    description: 'Campos no preparados, carga externa, búsqueda, rescate y táctica.',
    status: 'active',
  },
  {
    id: operationId.general,
    name: 'Consideraciones generales',
    description: 'Seguridad, comunicaciones, planeamiento y criterio de vuelo.',
    status: 'active',
  },
];

function maneuver(
  id: string,
  operation: string,
  code: string,
  name: string,
  description: string,
): ManeuverBankEntity {
  return { id, operationId: operation, code, name, description };
}

export const HELICOPTER_MANEUVERS: ManeuverBankEntity[] = [
  maneuver(maneuverId.briefing, operationId.ground, 'BRF', 'Briefing de la misión', 'Objetivo, secuencia, contingencias y responsabilidades.'),
  maneuver(maneuverId.inspection, operationId.ground, 'INSP', 'Inspección interior / exterior', 'Inspección visual y comprobación de condición antes del vuelo.'),
  maneuver(maneuverId.start, operationId.ground, 'ARR', 'Procedimientos de arranque / enganche', 'Aplicación ordenada de la lista de chequeo.'),
  maneuver(maneuverId.systems, operationId.ground, 'SIS', 'Chequeo de sistemas', 'Verificación de parámetros, avisos, controles y equipos.'),
  maneuver(maneuverId.shutdown, operationId.ground, 'APG', 'Procedimientos de desenganche / apagado', 'Cierre seguro de sistemas, motor y documentación.'),
  maneuver(maneuverId.hoverTakeoff, operationId.air, 'DVE', 'Despegue a vuelo estacionario', 'Levantamiento controlado, estabilización y potencia.'),
  maneuver(maneuverId.hover, operationId.air, 'VES', 'Vuelo estacionario', 'Control de posición, altura y rumbo.'),
  maneuver(maneuverId.airTaxiFormation, operationId.air, 'ROD-P', 'Rodaje aéreo en patrulla', 'Desplazamiento coordinado y separación segura.'),
  maneuver(maneuverId.formationTakeoff, operationId.air, 'DES-P', 'Despegue en patrulla', 'Salida coordinada con parámetros establecidos.'),
  maneuver(maneuverId.climb, operationId.air, 'ASC', 'Ascenso', 'Potencia, velocidad, rumbo y régimen de ascenso.'),
  maneuver(maneuverId.straightLevel, operationId.air, 'RYN', 'Recto y nivelado', 'Mantenimiento de altura, rumbo y velocidad.'),
  maneuver(maneuverId.formationApproach, operationId.air, 'APR-P', 'Aproximación en patrulla', 'Ingreso coordinado al área de aterrizaje.'),
  maneuver(maneuverId.landing, operationId.air, 'ATN', 'Aterrizaje normal', 'Aproximación estabilizada, descenso y toma.'),
  maneuver(maneuverId.echelon, operationId.formation, 'F-ESC', 'Formación escalón', 'Establecimiento y mantenimiento de posición escalonada.'),
  maneuver(maneuverId.column, operationId.formation, 'F-COL', 'Formación columna', 'Posición longitudinal y control de separación.'),
  maneuver(maneuverId.combatFormation, operationId.formation, 'F-COM', 'Formación combate', 'Disposición táctica y libertad de maniobra.'),
  maneuver(maneuverId.mutualSupport, operationId.formation, 'F-APO', 'Formación apoyo mutuo', 'Cobertura recíproca y referencias visuales.'),
  maneuver(maneuverId.formationTurns, operationId.formation, 'VIR-F', 'Virajes en formación', 'Virajes coordinados conservando posición.'),
  maneuver(maneuverId.positionChange, operationId.formation, 'CAM-P', 'Cambio de posición', 'Transición segura entre posiciones.'),
  maneuver(maneuverId.breakRejoin, operationId.formation, 'ROT-R', 'Rotura y reunión', 'Separación y reunión conforme a procedimientos.'),
  maneuver(maneuverId.lostSight, operationId.formation, 'PER-G', 'Pérdida de vista al guía', 'Procedimiento inmediato para evitar conflicto.'),
  maneuver(maneuverId.leaderChange, operationId.formation, 'CAM-G', 'Cambio de guía', 'Transferencia ordenada del liderazgo.'),
  maneuver(maneuverId.wingman, operationId.formation, 'CON-A', 'Consideración al alero', 'Disciplina, referencias y anticipación del alero.'),
  maneuver(maneuverId.areaClearance, operationId.general, 'CLA', 'Clareo de área', 'Verificación de obstáculos, tránsito y superficie.'),
  maneuver(maneuverId.inflightChecks, operationId.general, 'CHK-V', 'Chequeos en vuelo', 'Control periódico de instrumentos, combustible y sistemas.'),
  maneuver(maneuverId.radio, operationId.general, 'RAD', 'Procedimientos de radiocomunicaciones', 'Fraseología, escucha, reportes y coordinación.'),
  maneuver(maneuverId.planning, operationId.general, 'PLN', 'Planeamiento de vuelo', 'Ruta, combustible, meteorología, performance y riesgo.'),
  maneuver(maneuverId.knowledge, operationId.general, 'CON', 'Conocimientos generales', 'Aplicación de doctrina, manuales, límites y procedimientos.'),
  maneuver(maneuverId.safety, operationId.general, 'SEG', 'Condiciones de seguridad', 'Identificación de peligros y administración del riesgo.'),
  maneuver(maneuverId.judgment, operationId.general, 'CRI', 'Criterio de vuelo', 'Decisiones oportunas y manejo de contingencias.'),
  maneuver(maneuverId.autorotation, operationId.emergency, 'AUT', 'Autorrotación', 'Entrada, control de rotor, planeo y recuperación simulada.'),
  maneuver(maneuverId.engineFailureHover, operationId.emergency, 'FME-V', 'Falla de motor en estacionario', 'Respuesta inmediata y control de la toma.'),
  maneuver(maneuverId.engineFailureFlight, operationId.emergency, 'FME-T', 'Falla de motor en traslación', 'Entrada en autorrotación y selección de área.'),
  maneuver(maneuverId.instrument, operationId.navigation, 'INS-B', 'Vuelo básico por instrumentos', 'Control de actitud, potencia y performance.'),
  maneuver(maneuverId.holding, operationId.navigation, 'HOLD-H', 'Espera instrumental', 'Ingreso, viento, tiempos y mantenimiento del patrón.'),
  maneuver(maneuverId.navigation, operationId.navigation, 'NAV-V', 'Navegación visual', 'Orientación, ruta, tiempos y puntos de reporte.'),
  maneuver(maneuverId.confinedField, operationId.special, 'CAM-E', 'Operación en campo extraño', 'Reconocimiento y aterrizaje en campo no preparado.'),
  maneuver(maneuverId.externalLoad, operationId.special, 'CEX', 'Vuelo con carga externa', 'Enganche, control de oscilación, traslado y liberación.'),
  maneuver(maneuverId.search, operationId.special, 'PAT-S', 'Patrones de búsqueda', 'Selección y ejecución del patrón aplicable.'),
  maneuver(maneuverId.rescue, operationId.special, 'RES', 'Procedimiento de rescate', 'Aproximación, coordinación y recuperación de personal.'),
  maneuver(maneuverId.insertion, operationId.special, 'INS-E', 'Inserción y extracción', 'Ingreso, permanencia y salida de una zona de operación.'),
  maneuver(maneuverId.nvg, operationId.navigation, 'NVG-H', 'Empleo de visores nocturnos', 'Preparación, limitaciones, escaneo y operación con NVG.'),
  maneuver(maneuverId.tacticalNavigation, operationId.special, 'NAV-T', 'Navegación táctica', 'Ruta baja, sincronización y reacción ante amenazas.'),
  maneuver(maneuverId.operationsOrder, operationId.general, 'ORD-O', 'Orden de operaciones', 'Situación, misión, ejecución, apoyo y comando y control.'),
];

function hoursLabel(hours: number): string {
  return `${hours.toFixed(1).replace('.', ',')} h`;
}

export const HELICOPTER_MISSION_TYPES: MissionTypeEntity[] = allMissions.map((item) => ({
  id: item.id,
  code: item.code,
  name: item.name,
  description: `Misión de ${item.subphase} · ${hoursLabel(item.hours)} de vuelo.`,
}));

export const HELICOPTER_PHASE_BANKS: PhaseBankEntity[] = [
  { id: 'pb-heli-adap', code: 'ADAP', name: 'Adaptación', description: 'Transición progresiva al vuelo de ala rotatoria.', status: 'active' },
  { id: 'pb-heli-helitrans', code: 'HELITR', name: 'Operaciones helitransportadas', description: 'Campos no preparados, carga externa, SAR, OEH y NVG.', status: 'active' },
  { id: 'pb-heli-aerotac', code: 'AEROTAC', name: 'Operaciones aerotácticas', description: 'Formación y navegación táctica diurna y nocturna.', status: 'active' },
  { id: 'pb-heli-oo', code: 'O/O', name: 'Orden de operaciones', description: 'Misión integrada para consolidar el programa.', status: 'active' },
  { id: 'pb-heli-cf', code: 'CF', name: 'Complemento de fase', description: 'Misiones de refuerzo para recuperar el estándar.', status: 'active' },
];

export const HELICOPTER_SUBPHASE_BANKS: SubphaseBankEntity[] = [
  { id: 'sb-heli-contact', code: 'CON', name: 'Contacto', description: 'Control básico y adaptación al helicóptero.', status: 'active' },
  { id: 'sb-heli-check-solo', code: 'CHS', name: 'Chequeo solo', description: 'Verificación previa y salida solo.', status: 'active' },
  { id: 'sb-heli-emergency', code: 'EMG', name: 'Emergencias', description: 'Resolución supervisada de emergencias.', status: 'active' },
  { id: 'sb-heli-instruments', code: 'N/I', name: 'Navegación instrumentos', description: 'Navegación y vuelo instrumental.', status: 'active' },
  { id: 'sb-heli-formation', code: 'FOR', name: 'Formación', description: 'Vuelo práctico como guía y alero.', status: 'active' },
  { id: 'sb-heli-night', code: 'NOC', name: 'Nocturno', description: 'Control del helicóptero durante la noche.', status: 'active' },
  { id: 'sb-heli-confined', code: 'CX', name: 'Campos extraños', description: 'Campos confinados o no preparados.', status: 'active' },
  { id: 'sb-heli-external-load', code: 'CE', name: 'Carga externa', description: 'Operación con carga externa.', status: 'active' },
  { id: 'sb-heli-sar', code: 'SAR', name: 'Búsqueda y rescate', description: 'Patrones de búsqueda y recuperación.', status: 'active' },
  { id: 'sb-heli-special-ops', code: 'OEH', name: 'Operaciones especiales', description: 'Inserción y extracción de patrullas.', status: 'active' },
  { id: 'sb-heli-nvg', code: 'NVG', name: 'Visores nocturnos', description: 'Vuelo nocturno con NVG.', status: 'active' },
  { id: 'sb-heli-tactical-formation', code: 'FT', name: 'Formación táctica', description: 'Aplicación táctica de la formación.', status: 'active' },
  { id: 'sb-heli-ntd', code: 'NTD', name: 'Navegación táctica diurna', description: 'Navegación táctica de día.', status: 'active' },
  { id: 'sb-heli-ntn', code: 'NTN', name: 'Navegación táctica NVG', description: 'Navegación táctica nocturna.', status: 'active' },
  { id: 'sb-heli-operations-order', code: 'O/O', name: 'Orden de operaciones', description: 'Consolidación de fases y subfases.', status: 'active' },
  { id: 'sb-heli-completion', code: 'CF', name: 'Complemento de fase', description: 'Refuerzo por rendimiento o inactividad.', status: 'active' },
];

export const HELICOPTER_PROGRAMS: ProgramEntity[] = [
  {
    id: 'prg-heli-2023',
    code: 'PDI-HELI-2023',
    name: 'Curso Piloto de Helicóptero',
    programType: 'HELI',
    description: 'Programa 2023 de 120 horas de vuelo para operar helicópteros de día, de noche y con NVG bajo condiciones meteorológicas visuales.',
    status: 'active',
    imageUrl: '/programs/heli.jpg',
    standardIds: [],
  },
];

export const HELICOPTER_PHASES: PhaseEntity[] = [
  { id: 'ph-heli-adap', programId: 'prg-heli-2023', phaseBankId: 'pb-heli-adap', sortOrder: 1 },
  { id: 'ph-heli-helitrans', programId: 'prg-heli-2023', phaseBankId: 'pb-heli-helitrans', sortOrder: 2 },
  { id: 'ph-heli-aerotac', programId: 'prg-heli-2023', phaseBankId: 'pb-heli-aerotac', sortOrder: 3 },
  { id: 'ph-heli-oo', programId: 'prg-heli-2023', phaseBankId: 'pb-heli-oo', sortOrder: 4 },
  { id: 'ph-heli-cf', programId: 'prg-heli-2023', phaseBankId: 'pb-heli-cf', sortOrder: 5 },
];

const ground = [maneuverId.briefing, maneuverId.inspection, maneuverId.start, maneuverId.systems, maneuverId.shutdown];
const basicAir = [maneuverId.hoverTakeoff, maneuverId.hover, maneuverId.climb, maneuverId.straightLevel, maneuverId.landing];
const patrolAir = [maneuverId.airTaxiFormation, maneuverId.formationTakeoff, maneuverId.formationApproach];
const formation = [maneuverId.echelon, maneuverId.column, maneuverId.combatFormation, maneuverId.mutualSupport, maneuverId.formationTurns, maneuverId.positionChange, maneuverId.breakRejoin, maneuverId.lostSight, maneuverId.leaderChange, maneuverId.wingman];
const general = [maneuverId.areaClearance, maneuverId.inflightChecks, maneuverId.radio, maneuverId.planning, maneuverId.knowledge, maneuverId.safety, maneuverId.judgment];
const emergencies = [maneuverId.autorotation, maneuverId.engineFailureHover, maneuverId.engineFailureFlight];
const instrument = [maneuverId.instrument, maneuverId.holding, maneuverId.navigation];

function combine(...groups: readonly (readonly string[])[]): string[] {
  return [...new Set(groups.flatMap((group) => [...group]))];
}

const subphaseSeeds: SubphaseSeed[] = [
  { id: 'sp-heli-contact', phaseId: 'ph-heli-adap', subphaseBankId: 'sb-heli-contact', hours: 17, missions: missions.contact, maneuverIds: combine(ground, basicAir, general), sortOrder: 1 },
  { id: 'sp-heli-check-solo', phaseId: 'ph-heli-adap', subphaseBankId: 'sb-heli-check-solo', hours: 1, missions: missions.checkSolo, maneuverIds: combine(ground, basicAir, general), sortOrder: 2 },
  { id: 'sp-heli-emergency', phaseId: 'ph-heli-adap', subphaseBankId: 'sb-heli-emergency', hours: 12, missions: missions.emergencies, maneuverIds: combine(ground, basicAir, emergencies, general), sortOrder: 3 },
  { id: 'sp-heli-instruments', phaseId: 'ph-heli-adap', subphaseBankId: 'sb-heli-instruments', hours: 10, missions: missions.instruments, maneuverIds: combine(ground, basicAir, instrument, general), sortOrder: 4 },
  { id: 'sp-heli-formation', phaseId: 'ph-heli-adap', subphaseBankId: 'sb-heli-formation', hours: 5, missions: missions.formation, maneuverIds: combine(ground, basicAir, patrolAir, formation, general), sortOrder: 5 },
  { id: 'sp-heli-night', phaseId: 'ph-heli-adap', subphaseBankId: 'sb-heli-night', hours: 6, missions: missions.night, maneuverIds: combine(ground, basicAir, [maneuverId.nvg], general), sortOrder: 6 },
  { id: 'sp-heli-confined', phaseId: 'ph-heli-helitrans', subphaseBankId: 'sb-heli-confined', hours: 12, missions: missions.confined, maneuverIds: combine(ground, basicAir, [maneuverId.confinedField], general), sortOrder: 1 },
  { id: 'sp-heli-external-load', phaseId: 'ph-heli-helitrans', subphaseBankId: 'sb-heli-external-load', hours: 6, missions: missions.externalLoad, maneuverIds: combine(ground, basicAir, [maneuverId.externalLoad], general), sortOrder: 2 },
  { id: 'sp-heli-sar', phaseId: 'ph-heli-helitrans', subphaseBankId: 'sb-heli-sar', hours: 7, missions: missions.sar, maneuverIds: combine(ground, instrument, [maneuverId.search, maneuverId.rescue], general), sortOrder: 3 },
  { id: 'sp-heli-special-ops', phaseId: 'ph-heli-helitrans', subphaseBankId: 'sb-heli-special-ops', hours: 7, missions: missions.specialOperations, maneuverIds: combine(ground, formation, [maneuverId.insertion, maneuverId.tacticalNavigation], general), sortOrder: 4 },
  { id: 'sp-heli-nvg', phaseId: 'ph-heli-helitrans', subphaseBankId: 'sb-heli-nvg', hours: 8, missions: missions.nvg, maneuverIds: combine(ground, basicAir, [maneuverId.nvg, maneuverId.confinedField], general), sortOrder: 5 },
  { id: 'sp-heli-tactical-formation', phaseId: 'ph-heli-aerotac', subphaseBankId: 'sb-heli-tactical-formation', hours: 5, missions: missions.tacticalFormation, maneuverIds: combine(ground, patrolAir, formation, general), sortOrder: 1 },
  { id: 'sp-heli-ntd', phaseId: 'ph-heli-aerotac', subphaseBankId: 'sb-heli-ntd', hours: 9, missions: missions.tacticalDay, maneuverIds: combine(ground, patrolAir, formation, [maneuverId.tacticalNavigation], general), sortOrder: 2 },
  { id: 'sp-heli-ntn', phaseId: 'ph-heli-aerotac', subphaseBankId: 'sb-heli-ntn', hours: 8, missions: missions.tacticalNvg, maneuverIds: combine(ground, patrolAir, formation, [maneuverId.tacticalNavigation, maneuverId.nvg], general), sortOrder: 3 },
  { id: 'sp-heli-operations-order', phaseId: 'ph-heli-oo', subphaseBankId: 'sb-heli-operations-order', hours: 2, missions: missions.operationsOrder, maneuverIds: [maneuverId.briefing, maneuverId.planning, maneuverId.radio, maneuverId.knowledge, maneuverId.safety, maneuverId.judgment, maneuverId.operationsOrder], sortOrder: 1 },
  { id: 'sp-heli-completion', phaseId: 'ph-heli-cf', subphaseBankId: 'sb-heli-completion', hours: 5, missions: missions.completion, maneuverIds: combine(ground, basicAir, emergencies, instrument, general), sortOrder: 1 },
];

const maneuverById = new Map(HELICOPTER_MANEUVERS.map((item) => [item.id, item] as const));

function dirbeLevel(index: number, count: number, maneuverIdValue: string): DirbeLevel {
  if (count <= 1) return 'B';
  if (count === 2) return index === 0 ? 'B' : 'E';

  const levels: readonly DirbeLevel[] = ['D', 'I', 'R', 'B', 'E'];
  const progress = index / (count - 1);
  const operation = maneuverById.get(maneuverIdValue)?.operationId;
  const foundational = operation === operationId.ground || operation === operationId.general;
  const signature = [...maneuverIdValue].reduce((total, character) => total + character.charCodeAt(0), 0);
  const variation = ((signature % 5) - 2) * 0.3;
  const expected = foundational ? 3 + progress : progress * 4;
  const levelIndex = Math.max(0, Math.min(levels.length - 1, Math.round(expected + variation)));
  return levels[levelIndex];
}

function toSubphase(seed: SubphaseSeed): SubphaseEntity {
  const maneuverOperationIds: string[] = [];
  const maneuverAssignment: Record<string, string> = {};
  for (const id of seed.maneuverIds) {
    const operation = maneuverById.get(id)?.operationId;
    if (!operation) continue;
    maneuverAssignment[id] = operation;
    if (!maneuverOperationIds.includes(operation)) maneuverOperationIds.push(operation);
  }

  return {
    id: seed.id,
    phaseId: seed.phaseId,
    subphaseBankId: seed.subphaseBankId,
    hours: seed.hours,
    missionMode: 'manual',
    missionTypeIds: seed.missions.map((item) => item.id),
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: [...seed.maneuverIds],
    maneuverOperationIds,
    maneuverAssignment,
    standardAssignments: seed.missions.flatMap((item, missionIndex) =>
      seed.maneuverIds.map((id) => ({
        missionKey: catalogMissionKey(item.id),
        maneuverId: id,
        standardIds: [],
        dirbeLevel: dirbeLevel(missionIndex, seed.missions.length, id),
      })),
    ),
    sortOrder: seed.sortOrder,
  };
}

export const HELICOPTER_SUBPHASES: SubphaseEntity[] = subphaseSeeds.map(toSubphase);

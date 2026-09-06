import type {
  AircraftEntity,
  DirbeLevel,
  FleetEntity,
  ManeuverBankEntity,
  MissionTypeEntity,
  OperationEntity,
  PhaseBankEntity,
  PhaseEntity,
  ProgramEntity,
  PromotionEntity,
  PromotionMemberEntity,
  ProgramEnrollmentEntity,
  GroupMissionAssignmentEntity,
  IndividualMissionAssignmentEntity,
  MissionExecutionEntity,
  SquadronEntity,
  SpecialtyEntity,
  SpecialtyUserEntity,
  StandardEntity,
  StandardWeightingEntity,
  SubphaseBankEntity,
  SubphaseEntity,
  TemporaryCommissionEntity,
  UnitEntity,
  UserEntity,
  UserRoleEntity,
} from '../../domain/entities/admin-catalog';
import {
  automaticMissionKey,
  catalogMissionKey,
  curriculumMissionRefs,
  customMissionKey,
  expandAutoMissions,
} from '../../domain/services/admin-catalog';
import {
  HELICOPTER_COURSE_ASSIGNMENTS,
  HELICOPTER_COURSE_ENROLLMENTS,
  HELICOPTER_COURSE_EXECUTIONS,
  HELICOPTER_COURSE_GROUP_ASSIGNMENTS,
  HELICOPTER_MANEUVERS,
  HELICOPTER_MISSION_TYPES,
  HELICOPTER_OPERATIONS,
  HELICOPTER_PHASE_BANKS,
  HELICOPTER_PHASES,
  HELICOPTER_PROGRAMS,
  HELICOPTER_SUBPHASE_BANKS,
  HELICOPTER_SUBPHASES,
} from './helicopter-course.data';
import { PPL_GROUND_SUBPHASE_BANKS, PPL_GROUND_SUBPHASES } from './ppl-ground-courses.data';
import {
  DISPATCH_INDIVIDUAL_ASSIGNMENTS,
  DISPATCH_MISSION_EXECUTIONS,
} from './dispatch-board.data';
import {
  LIFECYCLE_ENROLLMENTS,
  LIFECYCLE_INDIVIDUAL_ASSIGNMENTS,
  LIFECYCLE_MISSION_EXECUTIONS,
} from './enrollment-lifecycle.data';
import {
  FLIGHT_ORDER_CONTEXT_AIRCRAFT,
  FLIGHT_ORDER_CONTEXT_ASSIGNMENTS,
  FLIGHT_ORDER_CONTEXT_ENROLLMENTS,
  FLIGHT_ORDER_CONTEXT_EXECUTIONS,
  FLIGHT_ORDER_CONTEXT_MEMBERS,
  FLIGHT_ORDER_CONTEXT_PROMOTIONS,
  FLIGHT_ORDER_CONTEXT_USERS,
} from './flight-order-context.data';

const DIRBE_SEED_CYCLE: readonly DirbeLevel[] = ['D', 'I', 'R', 'B'];

function seededDirbeLevel(missionIndex: number, maneuverIndex: number): DirbeLevel {
  return DIRBE_SEED_CYCLE[(missionIndex + maneuverIndex) % DIRBE_SEED_CYCLE.length];
}

function standardAssignmentsFor(
  missionKeys: readonly string[],
  standardsByManeuver: Readonly<Record<string, readonly string[]>>,
): SubphaseEntity['standardAssignments'] {
  const maneuvers = Object.entries(standardsByManeuver);
  return missionKeys.flatMap((missionKey, missionIndex) =>
    maneuvers.map(([maneuverId, standardIds], maneuverIndex) => ({
      missionKey,
      maneuverId,
      standardIds: [...standardIds],
      dirbeLevel: seededDirbeLevel(missionIndex, maneuverIndex),
    })),
  );
}

export const SEED_ROLES: UserRoleEntity[] = [
  {
    id: 'role-admin',
    code: 'ADSYS',
    name: 'Administrador',
    description: 'Acceso completo a seguridad, catálogos y operación del sistema.',
    status: 'active',
  },
  {
    id: 'role-director',
    code: 'COMDO',
    name: 'Director Académico',
    description: 'Dirige el plan de estudios, calendarios y el claustro instructor.',
    status: 'active',
  },
  {
    id: 'role-chief',
    code: 'JINST',
    name: 'Jefe de Instrucción',
    description: 'Coordina turnos, evaluaciones y la calidad de la instrucción.',
    status: 'active',
  },
  {
    id: 'role-instructor',
    code: 'INSTR',
    name: 'Instructor',
    description: 'Imparte sesiones, registra asistencia y evalúa a los alumnos.',
    status: 'active',
  },
  {
    id: 'role-student',
    code: 'PILOT',
    name: 'Alumno',
    description: 'Cursa especialidades, consulta horarios y entrega evidencias.',
    status: 'active',
  },
  {
    id: 'role-adper',
    code: 'ADPER',
    name: 'Administrador de personal',
    description: 'Gestiona la dotación de la unidad asignada y sus escuadrones.',
    status: 'active',
  },
  {
    id: 'role-jesqd',
    code: 'JESQD',
    name: 'Jefe de escuadrón',
    description: 'Comando táctico del escuadrón asignado.',
    status: 'active',
  },
  {
    id: 'role-joper',
    code: 'JOPER',
    name: 'Jefe de operaciones',
    description: 'Programación y consulta operativa sobre los escuadrones de su unidad.',
    status: 'active',
  },
  {
    id: 'role-evalu',
    code: 'EVALU',
    name: 'Evaluador',
    description: 'Chequeos de estandarización y dictámenes de vuelo.',
    status: 'active',
  },
  {
    id: 'role-audit',
    code: 'AUDIT',
    name: 'Consulta / Auditor',
    description: 'Fiscalización y consulta sin modificación operativa.',
    status: 'active',
  },
];

export const SEED_SPECIALTIES: SpecialtyEntity[] = [
  {
    id: 'spc-pilot',
    name: 'Pilotaje',
    description: 'Formación de vuelo y procedimientos de cabina.',
    status: 'active',
  },
  {
    id: 'spc-maint',
    name: 'Mantenimiento aeronáutico',
    description: 'Inspección, reparación y liberación técnica de aeronaves.',
    status: 'active',
  },
  {
    id: 'spc-atc',
    name: 'Control de tráfico',
    description: 'Gestión de movimientos en plataforma, rodaje y aproximación.',
    status: 'active',
  },
  {
    id: 'spc-flight-inst',
    name: 'Instrucción de vuelo',
    description: 'Metodología, briefing y evaluación de sesiones de vuelo.',
    status: 'active',
  },
  {
    id: 'spc-academic',
    name: 'Gestión académica',
    description: 'Planificación de cursos, expedientes y certificación.',
    status: 'active',
  },
  {
    id: 'spc-safety',
    name: 'Seguridad operacional',
    description: 'Reportes, barreras y cultura de seguridad en la operación.',
    status: 'inactive',
  },
];

const EXTRA_PEOPLE: [string, string][] = [
  ['Alba', 'Ferrer Sol'],
  ['Hugo', 'Pardo León'],
  ['Nuria', 'Beltrán Cid'],
  ['Óscar', 'Méndez Rivas'],
  ['Teresa', 'Gil Pascual'],
  ['Iván', 'Rubio Nadal'],
  ['Marta', 'Cos Varela'],
  ['Raúl', 'Vega Pinto'],
  ['Pilar', 'Nieto Calvo'],
  ['Jaime', 'Ortiz Luna'],
  ['Beatriz', 'Cano Riera'],
  ['Andrés', 'Lobo Sanz'],
  ['Silvia', 'Rueda Paz'],
  ['Tomás', 'Prieto Marín'],
  ['Natalia', 'Rey Cubero'],
  ['Félix', 'Mora Quintana'],
  ['Olga', 'Sáez Llorente'],
  ['Vicente', 'Lago Puig'],
  ['Inés', 'Prado Senra'],
  ['César', 'Duque Arias'],
  ['Ainhoa', 'Paz Romero'],
  ['Bruno', 'Sanz Coll'],
  ['Elisa', 'Montes Vidal'],
  ['Gonzalo', 'Vila Serra'],
];

const EXTRA_USERS: UserEntity[] = EXTRA_PEOPLE.map(([firstName, lastName], index) => {
  const slug = `${firstName}-${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]+/g, '-');
  return {
    id: `usr-${slug}`,
    firstName,
    lastName,
    email: `${slug.replace(/-/g, '.')}@alumno.siga.demo`,
    documentNumber: `${50000000 + index}X`,
    entryDate: `2024-${String((index % 12) + 1).padStart(2, '0')}-12`,
    indicative: `ALU-${300 + index}`,
    status: 'active',
    roleIds: ['role-student'],
    specialtyIds: index === 2 || index === 3 ? [] : ['spc-pilot'],
    assignedUnitId: 'unit-norte',
    assignedSquadronId: 'sq-alfa',
  };
});

export const SEED_USERS: UserEntity[] = [
  {
    id: 'usr-elena-martin',
    firstName: 'Elena',
    lastName: 'Martín Ruiz',
    email: 'elena.martin@correo.helvia.demo',
    documentNumber: '25198467M',
    entryDate: '2019-03-04',
    indicative: 'ADM-01',
    status: 'active',
    roleIds: ['role-admin'],
    specialtyIds: ['spc-academic'],
    assignedUnitId: null,
    assignedSquadronId: null,
  },
  {
    id: 'usr-diego-herrera',
    firstName: 'Diego',
    lastName: 'Herrera Salas',
    email: 'diego.herrera@siga.demo',
    documentNumber: '18456329K',
    entryDate: '2017-09-11',
    indicative: 'DIR-02',
    status: 'active',
    roleIds: ['role-director'],
    specialtyIds: ['spc-academic', 'spc-safety'],
    assignedUnitId: 'unit-academia',
    assignedSquadronId: null,
  },
  {
    id: 'usr-carmen-lopez',
    firstName: 'Carmen',
    lastName: 'López Vidal',
    email: 'carmen.lopez@siga.demo',
    documentNumber: '30987112H',
    entryDate: '2020-01-20',
    indicative: 'JIN-04',
    status: 'active',
    roleIds: ['role-chief'],
    specialtyIds: ['spc-flight-inst', 'spc-pilot'],
    assignedUnitId: 'unit-academia',
    assignedSquadronId: 'sq-formacion',
  },
  {
    id: 'usr-pablo-nunez',
    firstName: 'Pablo',
    lastName: 'Núñez Ortega',
    email: 'pablo.nunez@siga.demo',
    documentNumber: '44721908P',
    entryDate: '2022-06-01',
    indicative: 'INS-11',
    status: 'active',
    roleIds: ['role-instructor'],
    specialtyIds: ['spc-pilot'],
    assignedUnitId: 'unit-norte',
    assignedSquadronId: 'sq-alfa',
  },
  {
    id: 'usr-lucia-ramos',
    firstName: 'Lucía',
    lastName: 'Ramos Gil',
    email: 'lucia.ramos@siga.demo',
    documentNumber: '51220873T',
    entryDate: '2023-02-14',
    indicative: 'INS-18',
    status: 'active',
    roleIds: ['role-instructor'],
    specialtyIds: ['spc-maint'],
    assignedUnitId: 'unit-sur',
    assignedSquadronId: 'sq-sur',
  },
  {
    id: 'usr-sofia-vidal',
    firstName: 'Sofía',
    lastName: 'Vidal Romero',
    email: 'sofia.vidal@alumno.siga.demo',
    documentNumber: '77812045B',
    entryDate: '2025-09-08',
    indicative: 'ALU-203',
    status: 'active',
    roleIds: ['role-student'],
    specialtyIds: ['spc-pilot'],
    assignedUnitId: 'unit-norte',
    assignedSquadronId: 'sq-alfa',
  },
  {
    id: 'usr-diego-molina',
    firstName: 'Diego',
    lastName: 'Molina Cruz',
    email: 'diego.molina@alumno.siga.demo',
    documentNumber: '81204567D',
    entryDate: '2025-10-01',
    indicative: 'ALU-221',
    status: 'active',
    roleIds: ['role-student'],
    specialtyIds: [],
    assignedUnitId: 'unit-norte',
    assignedSquadronId: 'sq-alfa',
  },
  {
    id: 'usr-mario-castillo',
    firstName: 'Mario',
    lastName: 'Castillo Peña',
    email: 'mario.castillo@alumno.siga.demo',
    documentNumber: '69033418C',
    entryDate: '2024-10-02',
    indicative: 'ALU-118',
    status: 'inactive',
    roleIds: ['role-student'],
    specialtyIds: ['spc-atc'],
    assignedUnitId: 'unit-sur',
    assignedSquadronId: 'sq-sur',
  },
  {
    id: 'usr-irene-soto',
    firstName: 'Irene',
    lastName: 'Soto Bravo',
    email: 'irene.soto@siga.demo',
    documentNumber: '33120987F',
    entryDate: '2021-04-19',
    indicative: null,
    status: 'inactive',
    roleIds: ['role-instructor'],
    specialtyIds: ['spc-flight-inst'],
    assignedUnitId: 'unit-academia',
    assignedSquadronId: 'sq-formacion',
  },
  {
    id: 'usr-laura-mendez',
    firstName: 'Laura',
    lastName: 'Méndez Ortiz',
    email: 'laura.mendez@siga.demo',
    documentNumber: '40211876R',
    entryDate: '2018-05-12',
    indicative: 'ADP-03',
    status: 'active',
    roleIds: ['role-adper'],
    specialtyIds: ['spc-academic'],
    assignedUnitId: 'unit-sur',
    assignedSquadronId: null,
  },
  {
    id: 'usr-ricardo-pena',
    firstName: 'Ricardo',
    lastName: 'Peña Soler',
    email: 'ricardo.pena@siga.demo',
    documentNumber: '22881764L',
    entryDate: '2016-11-03',
    indicative: 'JES-07',
    status: 'active',
    roleIds: ['role-jesqd'],
    specialtyIds: ['spc-pilot'],
    assignedUnitId: 'unit-norte',
    assignedSquadronId: 'sq-bravo',
  },
  {
    id: 'usr-nuria-vega',
    firstName: 'Nuria',
    lastName: 'Vega Alonso',
    email: 'nuria.vega@siga.demo',
    documentNumber: '19330451Q',
    entryDate: '2015-02-18',
    indicative: 'JOP-05',
    status: 'active',
    roleIds: ['role-joper'],
    specialtyIds: ['spc-atc'],
    assignedUnitId: 'unit-norte',
    assignedSquadronId: null,
  },
  {
    id: 'usr-hector-diaz',
    firstName: 'Héctor',
    lastName: 'Díaz Romero',
    email: 'hector.diaz@siga.demo',
    documentNumber: '66120918V',
    entryDate: '2021-08-09',
    indicative: 'EVA-09',
    status: 'active',
    roleIds: ['role-evalu'],
    specialtyIds: ['spc-flight-inst'],
    assignedUnitId: 'unit-norte',
    assignedSquadronId: 'sq-alfa',
  },
  {
    id: 'usr-ana-rios',
    firstName: 'Ana',
    lastName: 'Ríos Calderón',
    email: 'ana.rios@siga.demo',
    documentNumber: '77441120S',
    entryDate: '2014-01-22',
    indicative: 'AUD-01',
    status: 'active',
    roleIds: ['role-audit'],
    specialtyIds: ['spc-safety'],
    assignedUnitId: null,
    assignedSquadronId: null,
  },
  ...EXTRA_USERS,
  ...FLIGHT_ORDER_CONTEXT_USERS,
];

export const SEED_PASSWORDS: Record<string, string> = Object.fromEntries(
  SEED_USERS.map((user) => [user.id, 'Helvia.2026']),
);

export const SEED_UNITS: UnitEntity[] = [
  {
    id: 'unit-norte',
    code: 'U-NORTE',
    name: 'Base Norte',
    abbreviation: 'BN',
    status: 'active',
  },
  {
    id: 'unit-sur',
    code: 'U-SUR',
    name: 'Base Sur',
    abbreviation: 'BS',
    status: 'active',
  },
  {
    id: 'unit-academia',
    code: 'U-ACA',
    name: 'Academia Central',
    abbreviation: 'AC',
    status: 'active',
  },
  {
    id: 'unit-plataforma',
    code: 'U-PLT',
    name: 'Plataforma',
    abbreviation: 'PL',
    status: 'inactive',
  },
  {
    id: 'unit-ga-51',
    code: 'GA-51',
    name: 'Grupo Aéreo N.º 51',
    abbreviation: 'GA-51',
    status: 'active',
    imageUrl: '/emblems/units/grupo-aereo-51.jpg',
  },
  {
    id: 'unit-ga-8',
    code: 'GA-8',
    name: 'Grupo Aéreo N.º 8',
    abbreviation: 'GA-8',
    status: 'active',
    imageUrl: '/emblems/units/grupo-aereo-8.png',
  },
];

export const SEED_SQUADRONS: SquadronEntity[] = [
  {
    id: 'sq-alfa',
    unitId: 'unit-norte',
    code: 'ESC-A',
    name: 'Escuadrón Alfa',
    description: 'Operación diurna y relevos de la Base Norte.',
    status: 'active',
  },
  {
    id: 'sq-bravo',
    unitId: 'unit-norte',
    code: 'ESC-B',
    name: 'Escuadrón Bravo',
    description: 'Turno nocturno y cobertura de emergencias.',
    status: 'active',
  },
  {
    id: 'sq-charlie',
    unitId: 'unit-norte',
    code: 'ESC-C',
    name: 'Escuadrón Charlie',
    description: 'Instrucción avanzada y relevos de la Base Norte.',
    status: 'active',
  },
  {
    id: 'sq-sur',
    unitId: 'unit-sur',
    code: 'ESC-S',
    name: 'Escuadrón Sur',
    description: 'Despliegue y apoyo en la Base Sur.',
    status: 'active',
  },
  {
    id: 'sq-delta',
    unitId: 'unit-sur',
    code: 'ESC-D',
    name: 'Escuadrón Delta',
    description: 'Cobertura táctica de la Base Sur.',
    status: 'active',
  },
  {
    id: 'sq-echo',
    unitId: 'unit-sur',
    code: 'ESC-E',
    name: 'Escuadrón Echo',
    description: 'Apoyo y relevos de la Base Sur.',
    status: 'active',
  },
  {
    id: 'sq-formacion',
    unitId: 'unit-academia',
    code: 'ESC-F',
    name: 'Escuadrón de Formación',
    description: 'Instrucción, briefing y evaluación de alumnado.',
    status: 'active',
  },
  {
    id: 'sq-510',
    unitId: 'unit-ga-51',
    code: 'EA-510',
    name: 'Escuadrón Aéreo 510',
    description: 'Escuadrón del Grupo Aéreo N.º 51.',
    status: 'active',
    imageUrl: '/emblems/squadrons/ea-510.png',
  },
  {
    id: 'sq-511',
    unitId: 'unit-ga-51',
    code: 'EA-511',
    name: 'Escuadrón Aéreo 511',
    description: 'Escuadrón del Grupo Aéreo N.º 51.',
    status: 'active',
    imageUrl: '/emblems/squadrons/ea-511.png',
  },
  {
    id: 'sq-512',
    unitId: 'unit-ga-51',
    code: 'EA-512',
    name: 'Escuadrón Aéreo 512',
    description: 'Escuadrón del Grupo Aéreo N.º 51.',
    status: 'active',
    imageUrl: '/emblems/squadrons/ea-512.png',
  },
  {
    id: 'sq-513',
    unitId: 'unit-ga-51',
    code: 'EA-513',
    name: 'Escuadrón Aéreo 513',
    description: 'Instrucción de caza del Grupo Aéreo N.º 51.',
    status: 'active',
    imageUrl: '/emblems/squadrons/ea-513.png',
  },
  {
    id: 'sq-842',
    unitId: 'unit-ga-8',
    code: 'EA-842',
    name: 'Escuadrón Aéreo 842',
    description: 'Escuadrón Hercules del Grupo Aéreo N.º 8.',
    status: 'active',
    imageUrl: '/emblems/squadrons/ea-842.png',
  },
  {
    id: 'sq-844',
    unitId: 'unit-ga-8',
    code: 'EA-844',
    name: 'Escuadrón Aéreo 844',
    description: 'Escuadrón del Grupo Aéreo N.º 8.',
    status: 'active',
    imageUrl: '/emblems/squadrons/ea-844.png',
  },
];

export const SEED_PROMOTIONS: PromotionEntity[] = [
  {
    id: 'promotion-2025-alfa',
    code: 'PROM-25-A',
    name: 'Promoción Alfa 2025',
    year: 2025,
    unitId: 'unit-norte',
    squadronId: 'sq-alfa',
    startDate: '2025-01-13',
    endDate: '2025-12-19',
  },
  {
    id: 'promotion-2024-bravo',
    code: 'PROM-24-B',
    name: 'Promoción Bravo 2024',
    year: 2024,
    unitId: 'unit-academia',
    squadronId: 'sq-formacion',
    startDate: '2024-09-09',
    endDate: '2025-06-27',
  },
  {
    id: 'promotion-2026-i',
    code: 'PROM-26-I',
    name: 'Promoción 2026-I',
    year: 2026,
    unitId: 'unit-norte',
    squadronId: 'sq-alfa',
    startDate: '2026-01-12',
    endDate: '2026-12-18',
  },
  ...FLIGHT_ORDER_CONTEXT_PROMOTIONS,
];

export const SEED_PROMOTION_MEMBERS: PromotionMemberEntity[] = [
  { id: 'promotion-member-1', promotionId: 'promotion-2025-alfa', userId: 'usr-sofia-vidal', entryDate: '2025-01-13' },
  { id: 'promotion-member-3', promotionId: 'promotion-2025-alfa', userId: 'usr-alba-ferrer-sol', entryDate: '2025-01-13' },
  { id: 'promotion-member-4', promotionId: 'promotion-2025-alfa', userId: 'usr-hugo-pardo-leon', entryDate: '2025-01-13' },
  { id: 'promotion-member-5', promotionId: 'promotion-2025-alfa', userId: 'usr-diego-molina', entryDate: '2025-01-13' },
  { id: 'promotion-member-6', promotionId: 'promotion-2025-alfa', userId: 'usr-nuria-beltran-cid', entryDate: '2025-01-13' },
  { id: 'promotion-member-7', promotionId: 'promotion-2025-alfa', userId: 'usr-oscar-mendez-rivas', entryDate: '2025-01-13' },
  { id: 'promotion-member-26-1', promotionId: 'promotion-2026-i', userId: 'usr-ivan-rubio-nadal', entryDate: '2026-01-12' },
  { id: 'promotion-member-26-2', promotionId: 'promotion-2026-i', userId: 'usr-marta-cos-varela', entryDate: '2026-01-12' },
  { id: 'promotion-member-26-3', promotionId: 'promotion-2026-i', userId: 'usr-raul-vega-pinto', entryDate: '2026-01-12' },
  { id: 'promotion-member-26-4', promotionId: 'promotion-2026-i', userId: 'usr-pilar-nieto-calvo', entryDate: '2026-01-12' },
  { id: 'promotion-member-26-5', promotionId: 'promotion-2026-i', userId: 'usr-jaime-ortiz-luna', entryDate: '2026-01-12' },
  { id: 'promotion-member-26-6', promotionId: 'promotion-2026-i', userId: 'usr-beatriz-cano-riera', entryDate: '2026-01-12' },
  { id: 'promotion-member-26-7', promotionId: 'promotion-2026-i', userId: 'usr-teresa-gil-pascual', entryDate: '2026-01-12' },
  { id: 'promotion-member-26-8', promotionId: 'promotion-2026-i', userId: 'usr-andres-lobo-sanz', entryDate: '2026-01-12' },
  { id: 'promotion-member-26-9', promotionId: 'promotion-2026-i', userId: 'usr-tomas-prieto-marin', entryDate: '2026-01-12' },
  ...FLIGHT_ORDER_CONTEXT_MEMBERS,
];

export const SEED_PROGRAM_ENROLLMENTS: ProgramEnrollmentEntity[] = [
  ...HELICOPTER_COURSE_ENROLLMENTS,
  ...LIFECYCLE_ENROLLMENTS,
  ...FLIGHT_ORDER_CONTEXT_ENROLLMENTS,
];

export const SEED_GROUP_ASSIGNMENTS: GroupMissionAssignmentEntity[] = [...HELICOPTER_COURSE_GROUP_ASSIGNMENTS];

const BASE_INDIVIDUAL_ASSIGNMENTS: IndividualMissionAssignmentEntity[] = [];

const BASE_MISSION_EXECUTIONS: MissionExecutionEntity[] = [];

export const SEED_COMMISSIONS: TemporaryCommissionEntity[] = [
  {
    id: 'com-elena-norte',
    userId: 'usr-elena-martin',
    originUnitId: 'unit-academia',
    destinationUnitId: 'unit-norte',
    startDate: '2026-09-01',
    endDate: '2026-10-15',
    reason: 'Apoyo a la coordinación académica durante el relevo de Base Norte.',
    status: 'registered',
  },
  {
    id: 'com-carmen-sur',
    userId: 'usr-carmen-lopez',
    originUnitId: 'unit-norte',
    destinationUnitId: 'unit-sur',
    startDate: '2026-08-18',
    endDate: '2026-09-30',
    reason: 'Supervisión de instrucción en el despliegue de Base Sur.',
    status: 'approved',
  },
  {
    id: 'com-pablo-academia',
    userId: 'usr-pablo-nunez',
    originUnitId: 'unit-norte',
    destinationUnitId: 'unit-academia',
    startDate: '2026-08-01',
    endDate: '2026-11-30',
    reason: 'Comisión de instructor para el curso de pilotaje.',
    status: 'active',
  },
  {
    id: 'com-lucia-norte',
    userId: 'usr-lucia-ramos',
    originUnitId: 'unit-academia',
    destinationUnitId: 'unit-norte',
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    reason: 'Apoyo de mantenimiento en la línea de Base Norte.',
    status: 'finished',
  },
];

export const SEED_OPERATIONS: OperationEntity[] = [
  {
    id: 'op-vfr',
    name: 'Vuelo visual',
    description: 'Operación diurna en condiciones VMC: circuitos, transiciones y toma y despegue.',
    status: 'active',
  },
  {
    id: 'op-ifr',
    name: 'Vuelo instrumental',
    description: 'Procedimientos IFR, espera, aproximación y mínima visibilidad.',
    status: 'active',
  },
  {
    id: 'op-nav',
    name: 'Navegación',
    description: 'Rutas, puntos de reporte y gestión de combustible en travesía.',
    status: 'active',
  },
  {
    id: 'op-emer',
    name: 'Emergencias',
    description: 'Pérdida, motor, fuego y toma forzosa. Solo en instrucción supervisada.',
    status: 'inactive',
  },
  ...HELICOPTER_OPERATIONS,
];

export const SEED_MISSION_TYPES: MissionTypeEntity[] = [
  {
    id: 'mt-local',
    code: 'LOC',
    name: 'Misión local',
    description: 'Circuito y zona de trabajo de la base, sin salir del TMA.',
  },
  {
    id: 'mt-nav',
    code: 'NAV',
    name: 'Navegación',
    description: 'Travesía con plan de vuelo y puntos de reporte.',
  },
  {
    id: 'mt-ifr',
    code: 'IFR',
    name: 'Instrumental',
    description: 'Salida, espera y aproximación por instrumentos.',
  },
  ...HELICOPTER_MISSION_TYPES,
];

export const SEED_MANEUVERS: ManeuverBankEntity[] = [
  {
    id: 'man-toff',
    operationId: 'op-vfr',
    code: 'TOFF',
    name: 'Despegue',
    description: 'Carrera, rotación y ascenso inicial con configuración limpia.',
  },
  {
    id: 'man-land',
    operationId: 'op-vfr',
    code: 'LAND',
    name: 'Aterrizaje',
    description: 'Aproximación estabilizada, flare y toma en el primer tercio.',
  },
  {
    id: 'man-hold',
    operationId: 'op-ifr',
    code: 'HOLD',
    name: 'Espera',
    description: 'Entrada directa o teardrop y mantenimiento del circuito publicado.',
  },
  {
    id: 'man-stall',
    operationId: 'op-emer',
    code: 'STALL',
    name: 'Pérdida',
    description: 'Reconocimiento, recuperación y control de altitud.',
  },
  ...HELICOPTER_MANEUVERS,
];

export const SEED_STANDARDS: StandardEntity[] = [
  {
    id: 'std-toff',
    code: 'TOFF-01',
    name: 'Despegue normal',
    description: 'Eje de pista, velocidades y perfil de ascenso.',
    sortOrder: 10,
  },
  {
    id: 'std-land',
    code: 'LAND-01',
    name: 'Aterrizaje estabilizado',
    description: 'Pendiente, velocidad y toma en zona marcada.',
    sortOrder: 20,
  },
  {
    id: 'std-hold',
    code: 'HOLD-01',
    name: 'Entrada a espera',
    description: 'Radial, crono y corrección de viento.',
    sortOrder: 30,
  },
  {
    id: 'std-crm',
    code: 'CRM-01',
    name: 'Gestión de cabina',
    description: 'Briefing, distribución de tareas y llamada cruzada.',
    sortOrder: 40,
  },
];

export const SEED_WEIGHTINGS: StandardWeightingEntity[] = [
  {
    id: 'w-toff-ppl',
    standardId: 'std-toff',
    unitId: 'unit-norte',
    squadronId: 'sq-alfa',
    program: 'PPL',
    weightedValue: 25,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    id: 'w-land-ppl',
    standardId: 'std-land',
    unitId: 'unit-norte',
    squadronId: 'sq-alfa',
    program: 'PPL',
    weightedValue: 30,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    id: 'w-hold-ir',
    standardId: 'std-hold',
    unitId: 'unit-sur',
    squadronId: 'sq-sur',
    program: 'IR',
    weightedValue: 20,
    validFrom: '2026-03-01',
    validTo: '2027-02-28',
  },
  {
    id: 'w-crm-cpl',
    standardId: 'std-crm',
    unitId: 'unit-academia',
    squadronId: 'sq-formacion',
    program: 'CPL',
    weightedValue: 15,
    validFrom: '2025-09-01',
    validTo: '2026-08-31',
  },
];

export function buildSpecialtyUsers(users: UserEntity[]): SpecialtyUserEntity[] {
  return users.flatMap((user) =>
    user.specialtyIds.map((specialtyId) => ({
      id: `su-${user.id}-${specialtyId}`,
      userId: user.id,
      specialtyId,
    })),
  );
}

export const SEED_FLEETS: FleetEntity[] = [
  {
    id: 'fleet-c152',
    fleetType: 'fixed-wing',
    code: 'C152',
    name: 'Escuela básica C152',
    description: 'Bimplaza de enseñanza inicial: circuitos, tomas y transiciones visuales.',
    status: 'active',
  },
  {
    id: 'fleet-c172',
    fleetType: 'fixed-wing',
    code: 'C172',
    name: 'Escuela visual C172',
    description: 'Cuatro plazas para navegación visual y trabajo en zona.',
    status: 'active',
  },
  {
    id: 'fleet-pa28',
    fleetType: 'fixed-wing',
    code: 'PA28',
    name: 'Transición PA-28',
    description: 'Ala baja para transición, performance y vuelo de travesía.',
    status: 'active',
  },
  {
    id: 'fleet-r44',
    fleetType: 'rotary',
    code: 'R44',
    name: 'Helicópteros R44',
    description: 'Ala rotatoria para hover, transiciones y autorrotación supervisada.',
    status: 'active',
  },
  {
    id: 'fleet-uas',
    fleetType: 'uas',
    code: 'UAS-1',
    name: 'Enjambre UAS',
    description: 'Sistemas no tripulados para observación y procedimientos de lanzamiento.',
    status: 'active',
  },
  {
    id: 'fleet-ifr',
    fleetType: 'fixed-wing',
    code: 'PA34',
    name: 'Instrumental bimotor',
    description: 'Bimotor para IFR, asimetría y procedimientos de espera.',
    status: 'inactive',
  },
];

export const SEED_AIRCRAFT: AircraftEntity[] = [
  {
    id: 'ac-hva',
    unitId: 'unit-norte',
    fleetId: 'fleet-c152',
    registration: 'EC-HVA',
    operational: true,
    status: 'active',
    imageUrl: '/aircraft/ec-hva.jpg',
  },
  {
    id: 'ac-hvb',
    unitId: 'unit-norte',
    fleetId: 'fleet-c152',
    registration: 'EC-HVB',
    operational: true,
    status: 'active',
    imageUrl: '/aircraft/ec-hvb.jpg',
  },
  {
    id: 'ac-hvc',
    unitId: 'unit-academia',
    fleetId: 'fleet-c172',
    registration: 'EC-HVC',
    operational: true,
    status: 'active',
    imageUrl: '/aircraft/ec-hvc.jpg',
  },
  {
    id: 'ac-hvd',
    unitId: 'unit-sur',
    fleetId: 'fleet-pa28',
    registration: 'EC-HVD',
    operational: false,
    status: 'active',
    imageUrl: '/aircraft/ec-hvd.jpg',
  },
  {
    id: 'ac-hvh',
    unitId: 'unit-norte',
    fleetId: 'fleet-r44',
    registration: 'EC-HVH',
    operational: true,
    status: 'active',
    imageUrl: '/aircraft/ec-hvh.jpg',
  },
  {
    id: 'ac-hvu',
    unitId: 'unit-academia',
    fleetId: 'fleet-uas',
    registration: 'EC-HVU',
    operational: true,
    status: 'active',
    imageUrl: '/aircraft/ec-hvu.jpg',
  },
  {
    id: 'ac-hvi',
    unitId: 'unit-sur',
    fleetId: 'fleet-ifr',
    registration: 'EC-HVI',
    operational: false,
    status: 'inactive',
    imageUrl: '/aircraft/ec-hvi.jpg',
  },
  ...FLIGHT_ORDER_CONTEXT_AIRCRAFT,
];

export const SEED_PHASE_BANKS: PhaseBankEntity[] = [
  {
    id: 'pb-teo',
    code: 'TEO',
    name: 'Teoría en aula',
    description: 'Conocimientos aeronáuticos, normativa y briefing de aula.',
    status: 'active',
  },
  {
    id: 'pb-bas',
    code: 'BAS',
    name: 'Vuelo básico',
    description: 'Circuitos, despegue, aterrizaje y control de la aeronave.',
    status: 'active',
  },
  {
    id: 'pb-nav',
    code: 'NAV',
    name: 'Navegación',
    description: 'Travesía visual, planificación y gestión de combustible.',
    status: 'active',
  },
  {
    id: 'pb-ifr',
    code: 'IFR',
    name: 'Instrumental',
    description: 'Salidas, esperas y aproximaciones por instrumentos.',
    status: 'active',
  },
  {
    id: 'pb-solo',
    code: 'SOLO',
    name: 'Vuelo solo',
    description: 'Primeros vuelos sin instructor a bordo.',
    status: 'active',
  },
  {
    id: 'pb-chk',
    code: 'CHK',
    name: 'Prueba de pericia',
    description: 'Evaluación final ante examinador.',
    status: 'active',
  },
  {
    id: 'pb-sim',
    code: 'SIM',
    name: 'Simulador',
    description: 'Entrenamiento en dispositivo de simulación de vuelo.',
    status: 'active',
  },
  ...HELICOPTER_PHASE_BANKS,
];

export const SEED_SUBPHASE_BANKS: SubphaseBankEntity[] = [
  {
    id: 'sb-aula',
    code: 'AULA',
    name: 'Aula',
    description: 'Clase teórica y ejercicios de mesa.',
    status: 'active',
  },
  {
    id: 'sb-brf',
    code: 'BRF',
    name: 'Briefing',
    description: 'Preparación de la lección y debriefing.',
    status: 'active',
  },
  {
    id: 'sb-sim',
    code: 'SIM',
    name: 'Simulador',
    description: 'Sesión en dispositivo de entrenamiento.',
    status: 'active',
  },
  {
    id: 'sb-dual',
    code: 'DUAL',
    name: 'Dual',
    description: 'Vuelo con instructor a bordo.',
    status: 'active',
  },
  {
    id: 'sb-solo',
    code: 'SOLO',
    name: 'Solo',
    description: 'Vuelo del alumno sin instructor.',
    status: 'active',
  },
  {
    id: 'sb-chk',
    code: 'CHK',
    name: 'Check',
    description: 'Vuelo o prueba de evaluación.',
    status: 'active',
  },
  ...PPL_GROUND_SUBPHASE_BANKS,
  ...HELICOPTER_SUBPHASE_BANKS,
];

export const SEED_PROGRAMS: ProgramEntity[] = [
  ...HELICOPTER_PROGRAMS,
  {
    id: 'prg-ppl',
    code: 'PPL-AF',
    name: 'Piloto privado · ala fija',
    programType: 'PPL',
    description: 'Plan de estudios para obtener la licencia PPL en ala fija: aula, vuelo básico, navegación y prueba.',
    status: 'active',
    imageUrl: '/programs/ppl.jpg',
    standardIds: ['std-toff', 'std-land'],
    lifecycleFlag: 'open',
  },
  {
    id: 'prg-ir',
    code: 'IR-ME',
    name: 'Habilitación instrumental',
    programType: 'IR',
    description: 'Itinerario IFR para tripulantes que ya tienen PPL o CPL.',
    status: 'active',
    imageUrl: '/programs/ir.jpg',
    standardIds: ['std-hold'],
    lifecycleFlag: 'open',
  },
  {
    id: 'prg-cpl',
    code: 'CPL-AF',
    name: 'Piloto comercial',
    programType: 'CPL',
    description: 'Continuación comercial sobre el PPL: precisión, travesía y pericia.',
    status: 'inactive',
    imageUrl: '/programs/cpl.jpg',
    standardIds: [],
    lifecycleFlag: 'open',
  },
];

export const SEED_PHASES: PhaseEntity[] = [
  ...HELICOPTER_PHASES,
  { id: 'ph-ppl-teo', programId: 'prg-ppl', phaseBankId: 'pb-teo', moduleKind: 'ground', sortOrder: 1 },
  { id: 'ph-ppl-sim', programId: 'prg-ppl', phaseBankId: 'pb-sim', moduleKind: 'simulator', sortOrder: 2 },
  { id: 'ph-ppl-bas', programId: 'prg-ppl', phaseBankId: 'pb-bas', moduleKind: 'air', sortOrder: 3 },
  { id: 'ph-ppl-nav', programId: 'prg-ppl', phaseBankId: 'pb-nav', moduleKind: 'air', sortOrder: 4 },
  { id: 'ph-ppl-solo', programId: 'prg-ppl', phaseBankId: 'pb-solo', moduleKind: 'air', sortOrder: 5 },
  { id: 'ph-ppl-chk', programId: 'prg-ppl', phaseBankId: 'pb-chk', moduleKind: 'air', sortOrder: 6 },
  { id: 'ph-ir-teo', programId: 'prg-ir', phaseBankId: 'pb-teo', moduleKind: 'ground', sortOrder: 1 },
  { id: 'ph-ir-ifr', programId: 'prg-ir', phaseBankId: 'pb-ifr', moduleKind: 'air', sortOrder: 2 },
  { id: 'ph-ir-chk', programId: 'prg-ir', phaseBankId: 'pb-chk', moduleKind: 'air', sortOrder: 3 },
  { id: 'ph-cpl-nav', programId: 'prg-cpl', phaseBankId: 'pb-nav', moduleKind: 'air', sortOrder: 1 },
  { id: 'ph-cpl-chk', programId: 'prg-cpl', phaseBankId: 'pb-chk', moduleKind: 'air', sortOrder: 2 },
];

export const SEED_SUBPHASES: SubphaseEntity[] = [
  ...HELICOPTER_SUBPHASES,
  ...PPL_GROUND_SUBPHASES,
  {
    id: 'sp-ppl-sim-proc',
    phaseId: 'ph-ppl-sim',
    subphaseBankId: 'sb-sim',
    hours: 10,
    missionMode: 'manual',
    missionTypeIds: ['mt-local'],
    customMissionNames: ['Procedimientos de cabina', 'Emergencias'],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: ['man-toff', 'man-land'],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: standardAssignmentsFor(
      [catalogMissionKey('mt-local'), customMissionKey('Procedimientos de cabina'), customMissionKey('Emergencias')],
      { 'man-toff': ['std-toff'], 'man-land': ['std-land'] },
    ),
    sortOrder: 1,
  },
  {
    id: 'sp-ppl-brf',
    phaseId: 'ph-ppl-bas',
    subphaseBankId: 'sb-brf',
    hours: 4,
    missionMode: 'manual',
    missionTypeIds: ['mt-local'],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: ['man-toff', 'man-land'],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: standardAssignmentsFor([catalogMissionKey('mt-local')], {
      'man-toff': ['std-toff'],
      'man-land': ['std-land'],
    }),
    sortOrder: 1,
  },
  {
    id: 'sp-ppl-dual',
    phaseId: 'ph-ppl-bas',
    subphaseBankId: 'sb-dual',
    hours: 18,
    missionMode: 'manual',
    missionTypeIds: ['mt-local'],
    customMissionNames: ['Circuito corto', 'Circuito largo'],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: ['man-toff', 'man-land', 'man-stall', 'man-hold'],
    maneuverOperationIds: ['op-vfr', 'op-emer', 'op-ifr'],
    maneuverAssignment: {
      'man-toff': 'op-vfr',
      'man-land': 'op-vfr',
      'man-stall': 'op-emer',
      'man-hold': 'op-ifr',
    },
    standardAssignments: standardAssignmentsFor(
      [catalogMissionKey('mt-local'), customMissionKey('Circuito corto'), customMissionKey('Circuito largo')],
      {
        'man-toff': ['std-toff'],
        'man-land': ['std-land'],
        'man-stall': ['std-crm'],
        'man-hold': ['std-hold'],
      },
    ),
    sortOrder: 2,
  },
  {
    id: 'sp-ppl-nav-dual',
    phaseId: 'ph-ppl-nav',
    subphaseBankId: 'sb-dual',
    hours: 10,
    missionMode: 'manual',
    missionTypeIds: ['mt-nav'],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: ['man-toff', 'man-land'],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: standardAssignmentsFor([catalogMissionKey('mt-nav')], {
      'man-toff': ['std-toff'],
      'man-land': ['std-land'],
    }),
    sortOrder: 1,
  },
  {
    id: 'sp-ppl-solo',
    phaseId: 'ph-ppl-solo',
    subphaseBankId: 'sb-solo',
    hours: 10,
    missionMode: 'automatic',
    missionTypeIds: [],
    customMissionNames: [],
    autoMissionCode: 'CER',
    autoMissionCount: 17,
    maneuverIds: ['man-toff', 'man-land'],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: standardAssignmentsFor(
      expandAutoMissions('CER', 17).map(automaticMissionKey),
      { 'man-toff': ['std-toff'], 'man-land': ['std-land'] },
    ),
    sortOrder: 1,
  },
  {
    id: 'sp-ppl-chk',
    phaseId: 'ph-ppl-chk',
    subphaseBankId: 'sb-chk',
    hours: 2,
    missionMode: 'manual',
    missionTypeIds: ['mt-local'],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: ['man-toff', 'man-land'],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: standardAssignmentsFor([catalogMissionKey('mt-local')], {
      'man-toff': ['std-toff'],
      'man-land': ['std-land'],
    }),
    sortOrder: 1,
  },
  {
    id: 'sp-ir-aula',
    phaseId: 'ph-ir-teo',
    subphaseBankId: 'sb-aula',
    hours: 20,
    missionMode: 'manual',
    missionTypeIds: [],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: [],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: [],
    sortOrder: 1,
  },
  {
    id: 'sp-ir-sim',
    phaseId: 'ph-ir-ifr',
    subphaseBankId: 'sb-sim',
    hours: 16,
    missionMode: 'manual',
    missionTypeIds: ['mt-ifr'],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: ['man-hold'],
    maneuverOperationIds: ['op-ifr'],
    maneuverAssignment: { 'man-hold': 'op-ifr' },
    standardAssignments: standardAssignmentsFor([catalogMissionKey('mt-ifr')], {
      'man-hold': ['std-hold'],
    }),
    sortOrder: 1,
  },
  {
    id: 'sp-ir-dual',
    phaseId: 'ph-ir-ifr',
    subphaseBankId: 'sb-dual',
    hours: 15,
    missionMode: 'manual',
    missionTypeIds: ['mt-ifr'],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: ['man-hold'],
    maneuverOperationIds: ['op-ifr'],
    maneuverAssignment: { 'man-hold': 'op-ifr' },
    standardAssignments: standardAssignmentsFor([catalogMissionKey('mt-ifr')], {
      'man-hold': ['std-hold'],
    }),
    sortOrder: 2,
  },
  {
    id: 'sp-ir-chk',
    phaseId: 'ph-ir-chk',
    subphaseBankId: 'sb-chk',
    hours: 2,
    missionMode: 'manual',
    missionTypeIds: ['mt-ifr'],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: ['man-hold'],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: standardAssignmentsFor([catalogMissionKey('mt-ifr')], {
      'man-hold': ['std-hold'],
    }),
    sortOrder: 1,
  },
  {
    id: 'sp-cpl-nav',
    phaseId: 'ph-cpl-nav',
    subphaseBankId: 'sb-dual',
    hours: 12,
    missionMode: 'manual',
    missionTypeIds: ['mt-nav'],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: ['man-toff', 'man-land'],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: [],
    sortOrder: 1,
  },
  {
    id: 'sp-cpl-chk',
    phaseId: 'ph-cpl-chk',
    subphaseBankId: 'sb-chk',
    hours: 2.5,
    missionMode: 'manual',
    missionTypeIds: ['mt-nav'],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: ['man-toff', 'man-land'],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: [],
    sortOrder: 1,
  },
];

function isoDate(start: string, offsetDays: number): string {
  const date = new Date(`${start}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function slotsForProgram(programId: string): string[] {
  const phaseIds = SEED_PHASES.filter((phase) => phase.programId === programId)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((phase) => phase.id);
  const ordered = SEED_SUBPHASES.filter((item) => phaseIds.includes(item.phaseId)).slice().sort((a, b) => {
    const phaseA = phaseIds.indexOf(a.phaseId);
    const phaseB = phaseIds.indexOf(b.phaseId);
    if (phaseA !== phaseB) return phaseA - phaseB;
    return a.sortOrder - b.sortOrder;
  });
  return ordered.flatMap((subphase) => curriculumMissionRefs(subphase).map((ref) => ref.value));
}

function seedAcademicTrack(input: {
  prefix: string;
  studentId: string;
  programId: string;
  instructorIds: readonly string[];
  startDate: string;
  completeCount: number;
  gradePattern: 'excellent' | 'high' | 'solid';
  failFrom?: number;
}): { assignments: IndividualMissionAssignmentEntity[]; executions: MissionExecutionEntity[] } {
  const missions = slotsForProgram(input.programId).slice(0, input.completeCount);
  const assignments: IndividualMissionAssignmentEntity[] = [];
  const executions: MissionExecutionEntity[] = [];
  missions.forEach((missionId, index) => {
    const assignmentId = `${input.prefix}-as-${String(index + 1).padStart(3, '0')}`;
    const executionId = `${input.prefix}-ex-${String(index + 1).padStart(3, '0')}`;
    const date = isoDate(input.startDate, index);
    const instructorId = input.instructorIds[index % input.instructorIds.length] ?? input.instructorIds[0] ?? null;
    const failed = input.failFrom !== undefined && index >= input.failFrom;
    const grade = failed ? 'I' : input.gradePattern === 'excellent' ? 'E' : input.gradePattern === 'high' ? (index % 5 === 0 ? 'B' : 'E') : index % 3 === 0 ? 'E' : 'B';
    assignments.push({
      id: assignmentId,
      assignmentCase: 'pdi',
      studentId: input.studentId,
      externalPerson: null,
      programId: input.programId,
      missionId,
      instructorId,
      date,
      status: 'completed',
    });
    executions.push({
      id: executionId,
      individualAssignmentId: assignmentId,
      status: 'completed',
      startDate: date,
      startTime: '08:00',
      takeoffTime: '08:10',
      landingTime: '09:20',
      executedHours: 1.2,
      aircraftId: 'ac-hva',
      observations: '',
      strengths: '',
      improvements: '',
      recommendations: '',
      result: failed ? 'failed' : 'approved',
      evaluations: [
        { id: `${executionId}-ev`, maneuverId: 'man-toff', grade, observation: '', evidenceName: null },
      ],
    });
  });
  return { assignments, executions };
}

const sofiaPpl = seedAcademicTrack({
  prefix: 'sofia-ppl',
  studentId: 'usr-sofia-vidal',
  programId: 'prg-ppl',
  instructorIds: ['usr-pablo-nunez'],
  startDate: '2024-03-04',
  completeCount: slotsForProgram('prg-ppl').length,
  gradePattern: 'high',
});
const sofiaIr = seedAcademicTrack({
  prefix: 'sofia-ir',
  studentId: 'usr-sofia-vidal',
  programId: 'prg-ir',
  instructorIds: ['usr-pablo-nunez'],
  startDate: '2024-11-04',
  completeCount: slotsForProgram('prg-ir').length,
  gradePattern: 'solid',
});
const marioPpl = seedAcademicTrack({
  prefix: 'mario-ppl',
  studentId: 'usr-mario-castillo',
  programId: 'prg-ppl',
  instructorIds: ['usr-lucia-ramos'],
  startDate: '2023-09-11',
  completeCount: slotsForProgram('prg-ppl').length,
  gradePattern: 'solid',
});

export const SEED_INDIVIDUAL_ASSIGNMENTS: IndividualMissionAssignmentEntity[] = [
  ...BASE_INDIVIDUAL_ASSIGNMENTS,
  ...DISPATCH_INDIVIDUAL_ASSIGNMENTS,
  ...LIFECYCLE_INDIVIDUAL_ASSIGNMENTS,
  ...sofiaPpl.assignments,
  ...sofiaIr.assignments,
  ...HELICOPTER_COURSE_ASSIGNMENTS,
  ...marioPpl.assignments,
  ...FLIGHT_ORDER_CONTEXT_ASSIGNMENTS,
];

export const SEED_MISSION_EXECUTIONS: MissionExecutionEntity[] = [
  ...BASE_MISSION_EXECUTIONS,
  ...DISPATCH_MISSION_EXECUTIONS,
  ...LIFECYCLE_MISSION_EXECUTIONS,
  ...sofiaPpl.executions,
  ...sofiaIr.executions,
  ...HELICOPTER_COURSE_EXECUTIONS,
  ...marioPpl.executions,
  ...FLIGHT_ORDER_CONTEXT_EXECUTIONS,
];


import type {
  ManeuverBankEntity,
  MissionTypeEntity,
  OperationEntity,
  SquadronEntity,
  SpecialtyEntity,
  SpecialtyUserEntity,
  StandardEntity,
  StandardWeightingEntity,
  TemporaryCommissionEntity,
  UnitEntity,
  UserEntity,
  UserRoleEntity,
} from '../../domain/entities/admin-catalog';

export const SEED_ROLES: UserRoleEntity[] = [
  {
    id: 'role-admin',
    name: 'Administrador',
    description: 'Acceso completo a seguridad, catálogos y operación del sistema.',
    status: 'active',
  },
  {
    id: 'role-director',
    name: 'Director Académico',
    description: 'Dirige el plan de estudios, calendarios y el claustro instructor.',
    status: 'active',
  },
  {
    id: 'role-chief',
    name: 'Jefe de Instrucción',
    description: 'Coordina turnos, evaluaciones y la calidad de la instrucción.',
    status: 'active',
  },
  {
    id: 'role-instructor',
    name: 'Instructor',
    description: 'Imparte sesiones, registra asistencia y evalúa a los alumnos.',
    status: 'active',
  },
  {
    id: 'role-student',
    name: 'Alumno',
    description: 'Cursa especialidades, consulta horarios y entrega evidencias.',
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
    specialtyIds: ['spc-pilot'],
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
  },
  ...EXTRA_USERS,
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
    id: 'sq-sur',
    unitId: 'unit-sur',
    code: 'ESC-S',
    name: 'Escuadrón Sur',
    description: 'Despliegue y apoyo en la Base Sur.',
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
];

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

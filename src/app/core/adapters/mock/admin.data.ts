import type {
  SpecialtyEntity,
  SpecialtyUserEntity,
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

export function buildSpecialtyUsers(users: UserEntity[]): SpecialtyUserEntity[] {
  return users.flatMap((user) =>
    user.specialtyIds.map((specialtyId) => ({
      id: `su-${user.id}-${specialtyId}`,
      userId: user.id,
      specialtyId,
    })),
  );
}

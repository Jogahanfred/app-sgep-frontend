import type { NavColumn, NavGroup, NavLink } from '@shared/models/nav.model';
import { NAV_ROUTES } from './nav-routes.constants';

function links(...items: ReadonlyArray<readonly [string, string]>): NavLink[] {
  return items.map(([label, href]) => ({ label, href }));
}

function column(heading: string, items: NavLink[]): NavColumn {
  return { blocks: [{ heading, links: items }] };
}

const administration: NavColumn[] = [
  column(
    'Acceso y seguridad',
    links(
      ['Usuarios', NAV_ROUTES.users],
      ['Roles y Permisos', NAV_ROUTES.roles],
      ['Especialidades', NAV_ROUTES.specialties],
    ),
  ),
  column(
    'Organización',
    links(
      ['Unidades', NAV_ROUTES.units],
      ['Escuadrones', NAV_ROUTES.squadrons],
      ['Comisiones Temporales', NAV_ROUTES.commissions],
    ),
  ),
];

const catalogs: NavColumn[] = [
  column(
    'Académico',
    links(
      ['Programas', NAV_ROUTES.programs],
      ['Estándares', NAV_ROUTES.standards],
      ['Ponderaciones', NAV_ROUTES.weightings],
      ['Operaciones', NAV_ROUTES.operations],
      ['Tipos de Misión', NAV_ROUTES.missionTypes],
    ),
  ),
  column(
    'Bancos académicos',
    links(
      ['Banco de Fases', NAV_ROUTES.phaseBanks],
      ['Banco de Subfases', NAV_ROUTES.subphaseBanks],
      ['Banco de Maniobras', NAV_ROUTES.maneuvers],
    ),
  ),
  column(
    'Recursos',
    links(
      ['Flotas', NAV_ROUTES.fleets],
      ['Aeronaves', NAV_ROUTES.aircraft],
    ),
  ),
];

const programming: NavColumn[] = [
  column(
    'Formación',
    links(
      ['Promociones', NAV_ROUTES.promotions],
      ['Matrícula', NAV_ROUTES.enrollment],
    ),
  ),
  column(
    'Entrenamiento',
    links(
      ['Orden de vuelo y asignación', NAV_ROUTES.flightOrder],
      ['Programación y despacho diario', NAV_ROUTES.dispatch],
    ),
  ),
];

const missions: NavColumn[] = [
  column(
    'Ejecución',
    links(['Ejecución y calificación', NAV_ROUTES.missionExecution]),
  ),
];

const grades: NavColumn[] = [
  column(
    'Seguimiento',
    links(['Avance Académico', NAV_ROUTES.academicProgress]),
  ),
];

const reports: NavColumn[] = [
  column(
    'Académicos',
    links(
      ['Historial de alumno', NAV_ROUTES.reportStudentHistory],
      ['Historial de promoción', NAV_ROUTES.reportPromotionHistory],
      ['Estadísticas académicas', NAV_ROUTES.reportAcademicStats],
      ['Ranking de alumnos', NAV_ROUTES.reportStudentRanking],
      ['Ranking de promociones', NAV_ROUTES.reportPromotionRanking],
    ),
  ),
  column(
    'Operativos',
    links(
      ['Horas por programa', NAV_ROUTES.reportHoursProgram],
      ['Horas por aeronave', NAV_ROUTES.reportHoursAircraft],
      ['Rendimiento por instructor', NAV_ROUTES.reportInstructor],
    ),
  ),
];

export const MAIN_NAV: NavGroup[] = [
  { label: 'Dashboard', href: NAV_ROUTES.dashboard, columns: [] },
  { label: 'Administración', columns: administration },
  { label: 'Catálogos', columns: catalogs },
  { label: 'Programación', columns: programming, matchHrefs: [NAV_ROUTES.training] },
  { label: 'Misiones', columns: missions },
  { label: 'Calificaciones', columns: grades },
  { label: 'Reportes', columns: reports },
];

export const AUDIENCE_NAV = MAIN_NAV;

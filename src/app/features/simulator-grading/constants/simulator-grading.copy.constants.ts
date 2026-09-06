import { NAV_ROUTES } from '@layout/navigation/data/nav-routes.constants';

export const SIMULATOR_GRADING_ROUTES = {
  inbox: NAV_ROUTES.simulatorGrading,
  session: (programId: string, promotionId: string, sessionId: string) =>
    `${NAV_ROUTES.simulatorGrading}/${programId}/${promotionId}/${sessionId}`,
} as const;

export const SIMULATOR_GRADING_COPY = {
  lead: 'Selecciona el programa y la promoción para ver las sesiones de simulador.',
  needsSquadron: 'Selecciona un escuadrón en el encabezado para calificar el simulador.',
  loadError: 'No hemos podido cargar las sesiones de simulador. Recarga la página.',
  saveError: 'No hemos podido guardar la nota.',
  forbidden: 'Tu rol no puede calificar el simulador.',
  programLabel: 'Programa',
  promotionLabel: 'Promoción',
  searchLabel: 'Buscar',
  searchPlaceholder: 'Sesión o código',
  studentSearchPlaceholder: 'Nombre o indicativo',
  pickFilters: 'Elige un programa y una promoción para ver las sesiones.',
  emptySessions: 'No hay sesiones de simulador para esta promoción.',
  emptyStudents: 'No hay alumnos cargados en esta sesión.',
  tableCaption: 'Sesiones de simulador del programa y la promoción seleccionados',
  colCode: 'Código',
  colName: 'Nombre',
  colHours: 'Horas',
  colMissions: 'Misiones',
  colRequirements: 'Requisitos',
  back: 'Volver a sesiones',
  indexLabel: '#',
  nameLabel: 'Nombre',
  averageLabel: 'Promedio',
  save: 'Guardar',
  none: '—',
} as const;

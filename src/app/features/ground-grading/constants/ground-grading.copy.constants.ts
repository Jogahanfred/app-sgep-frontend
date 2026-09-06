import { NAV_ROUTES } from '@layout/navigation/data/nav-routes.constants';

export const GROUND_GRADING_ROUTES = {
  inbox: NAV_ROUTES.groundGrading,
  course: (programId: string, promotionId: string, courseId: string) =>
    `${NAV_ROUTES.groundGrading}/${programId}/${promotionId}/${courseId}`,
} as const;

export const GROUND_GRADING_COPY = {
  lead: 'Selecciona el programa y la promoción para ver las asignaturas en tierra.',
  needsSquadron: 'Selecciona un escuadrón en el encabezado para calificar los cursos en tierra.',
  loadError: 'No hemos podido cargar los cursos en tierra. Recarga la página.',
  saveError: 'No hemos podido guardar la nota.',
  forbidden: 'Tu rol no puede calificar cursos en tierra.',
  programLabel: 'Programa',
  promotionLabel: 'Promoción',
  searchLabel: 'Buscar',
  searchPlaceholder: 'Asignatura o código',
  studentSearchPlaceholder: 'Nombre o indicativo',
  pickFilters: 'Elige un programa y una promoción para ver las asignaturas.',
  emptyCourses: 'No hay cursos en tierra para esta promoción.',
  emptyStudents: 'No hay alumnos cargados en este curso.',
  tableCaption: 'Asignaturas del programa y la promoción seleccionados',
  colCode: 'Código',
  colName: 'Nombre',
  colCredits: 'Créditos',
  colHours: 'Horas',
  colTheory: 'TEO',
  colLab: 'LAB',
  colOther: 'Otros',
  colTotal: 'Total',
  colRequirements: 'Requisitos',
  back: 'Volver a asignaturas',
  indexLabel: '#',
  nameLabel: 'Nombre',
  averageLabel: 'Promedio',
  save: 'Guardar',
  none: '—',
} as const;

export interface CatalogPageHeader {
  readonly title: string;
  readonly lead: string;
}

export const CATALOG_PAGE_HEADERS: Record<string, CatalogPageHeader> = {
  usuarios: {
    title: 'Usuarios',
    lead: 'Personas que ingresan al sistema.',
  },
  roles: {
    title: 'Roles y Permisos',
    lead: 'Roles de usuario del sistema.',
  },
  especialidades: {
    title: 'Especialidades',
    lead: 'Especialidades del personal.',
  },
  unidades: {
    title: 'Unidades',
    lead: 'Unidades donde opera el personal.',
  },
  escuadrones: {
    title: 'Escuadrones',
    lead: 'Escuadrones adscritos a cada unidad.',
  },
  'comisiones-temporales': {
    title: 'Comisiones Temporales',
    lead: 'Desplazamientos temporales del personal entre unidades.',
  },
  programas: {
    title: 'Programas',
    lead: 'Programas de formación y planes de estudios.',
  },
  estandares: {
    title: 'Estándares',
    lead: 'Estándares de evaluación de instrucción.',
  },
  ponderaciones: {
    title: 'Ponderaciones',
    lead: 'Ponderaciones de estándares por unidad, escuadrón y programa.',
  },
  operaciones: {
    title: 'Operaciones',
    lead: 'Catálogo maestro de operaciones de instrucción.',
  },
  'tipos-de-mision': {
    title: 'Tipos de Misión',
    lead: 'Catálogo maestro de tipos de misión.',
  },
  'banco-fases': {
    title: 'Banco de Fases',
    lead: 'Catálogo maestro de fases de formación académica.',
  },
  'banco-subfases': {
    title: 'Banco de Subfases',
    lead: 'Catálogo maestro de subfases de formación académica.',
  },
  maniobras: {
    title: 'Banco de Maniobras',
    lead: 'Banco de maniobras de instrucción.',
  },
  flotas: {
    title: 'Flotas',
    lead: 'Catálogo de flotas de material aéreo.',
  },
  aeronaves: {
    title: 'Aeronaves',
    lead: 'Registro de aeronaves con imagen, flota y unidad.',
  },
  promociones: {
    title: 'Promociones',
    lead: 'Promociones y grupos de alumnos.',
  },
  matricula: {
    title: 'Matrícula',
    lead: 'Matricula una promoción o un alumno a un programa. En la promoción puedes ver a los participantes.',
  },
  'programacion-entrenamiento': {
    title: 'Programación y asignación de misiones',
    lead: 'Programa cursos y misiones para grupos y alumnos.',
  },
  'despacho-diario': {
    title: 'Programación y despacho diario',
    lead: 'Supervise los vuelos del día, despache a cabina y habilite la rúbrica del instructor.',
  },
  'orden-de-vuelo': {
    title: 'Generación de orden de vuelo y asignación',
    lead: 'Enlace al alumno con la siguiente misión curricular, el instructor, la fecha y hora previstas y la aeronave asignada.',
  },
  'ejecucion-misiones': {
    title: 'Ejecución y calificación',
    lead: 'Bandeja de misiones pendientes y calificación académica.',
  },
  'avance-academico': {
    title: 'Avance Académico',
    lead: 'Consulta el progreso actual y el historial de formación de cada alumno.',
  },
  reportes: {
    title: 'Reportes',
    lead: 'Consulta e exporta información académica y operativa del contexto seleccionado en el encabezado.',
  },
};

export function catalogPageHeader(url: string): CatalogPageHeader | null {
  if (isEnrollmentWorkspaceUrl(url)) return CATALOG_PAGE_HEADERS['matricula'];
  const match = /\/catalogo\/([^/?#]+)/.exec(url);
  if (!match) return null;
  return CATALOG_PAGE_HEADERS[match[1]] ?? null;
}

export function isCatalogRecordUrl(url: string): boolean {
  if (isEnrollmentWorkspaceUrl(url)) return false;
  return /\/catalogo\/(usuarios|roles|especialidades|unidades|escuadrones|comisiones-temporales|operaciones|tipos-de-mision|maniobras|estandares|ponderaciones|flotas|aeronaves|programas|banco-fases|banco-subfases|promociones|matricula|programacion-entrenamiento|despacho-diario|orden-de-vuelo|ejecucion-misiones|avance-academico)\/[^/?#]+/.test(
    url,
  );
}

function isEnrollmentWorkspaceUrl(url: string): boolean {
  return (
    /\/catalogo\/matricula(?:\/|$|\?)/.test(url) ||
    /\/catalogo\/programacion-entrenamiento\/(grupal|individual)(?:\/|$|\?)/.test(url)
  );
}

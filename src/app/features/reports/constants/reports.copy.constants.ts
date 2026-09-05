import type { ReportKind } from '@core/application';

export const REPORTS_BASE = '/catalogo/reportes';

export const REPORT_KIND_SLUGS: Record<ReportKind, string> = {
  'student-history': 'historial-alumno',
  'promotion-history': 'historial-promocion',
  'academic-stats': 'estadisticas-academicas',
  'student-ranking': 'ranking-alumnos',
  'promotion-ranking': 'ranking-promociones',
  'hours-by-program': 'horas-programa',
  'hours-by-aircraft': 'horas-aeronave',
  'instructor-performance': 'rendimiento-instructor',
};

export const REPORTS_COPY = {
  lead: 'Consulta e exporta información académica y operativa del contexto seleccionado en el encabezado.',
  typeLabel: 'Tipo de reporte',
  fromLabel: 'Desde',
  toLabel: 'Hasta',
  programLabel: 'Programa',
  promotionLabel: 'Promoción',
  studentLabel: 'Alumno',
  instructorLabel: 'Instructor',
  aircraftLabel: 'Aeronave',
  all: 'Todos',
  consult: 'Consultar',
  export: 'Exportar',
  empty: 'No hay resultados con esos filtros.',
  loadError: 'No hemos podido cargar el reporte.',
  needsSquadron:
    'Selecciona un escuadrón en el encabezado para generar el reporte. Esta pantalla no pide de nuevo la unidad.',
  kinds: {
    'student-history': 'Historial de alumno',
    'promotion-history': 'Historial de promoción',
    'academic-stats': 'Estadísticas académicas',
    'student-ranking': 'Ranking de alumnos',
    'promotion-ranking': 'Ranking de promociones',
    'hours-by-program': 'Horas por programa',
    'hours-by-aircraft': 'Horas por aeronave',
    'instructor-performance': 'Rendimiento por instructor',
  },
} as const;

export function reportKindFromSlug(slug: string | null): ReportKind {
  const match = (Object.entries(REPORT_KIND_SLUGS) as [ReportKind, string][]).find(([, value]) => value === slug);
  return match?.[0] ?? 'student-history';
}

export function reportHref(kind: ReportKind): string {
  return `${REPORTS_BASE}/${REPORT_KIND_SLUGS[kind]}`;
}

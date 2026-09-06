import { NAV_ROUTES } from '@layout/navigation/data/nav-routes.constants';
import type { ChoiceOption } from '@shared/models/choice.model';

export const FLIGHT_INCIDENT_MISSION_ORIGIN = 'mision';

export const FLIGHT_INCIDENT_ROUTES = {
  list: NAV_ROUTES.incidents,
  register: NAV_ROUTES.incidentRegister,
  detail: (id: string) => `${NAV_ROUTES.incidents}/${id}`,
  action: (id: string, view = false) =>
    `${NAV_ROUTES.incidents}/${id}/accion${view ? '?modo=ver' : ''}`,
  fromExecution: (executionId: string, fromMission = false) => {
    const path = `${NAV_ROUTES.missionExecution}/${executionId}/incidencia`;
    return fromMission ? `${path}?origen=${FLIGHT_INCIDENT_MISSION_ORIGIN}` : path;
  },
} as const;

export const FLIGHT_INCIDENT_COPY = {
  crumbOps: 'Operaciones de vuelo',
  crumbFleet: 'Ejecución de misiones',
  crumbReport: 'Reporte de discrepancia',
  folioLabel: 'Folio provisional',
  formEdition: 'Formulario activo',
  pageTitle: 'Registro oficial de discrepancia o incidencia de vuelo',
  pageLead:
    'Formulario para reporte técnico, operativo o de seguridad en vuelo vinculado a la misión en curso.',
  back: 'Volver a la hoja operativa',
  backToList: 'Volver a incidencias',
  draftBadge: 'Borrador de reporte',
  viewBadge: 'Incidencia registrada',
  sectionOps: 'Vinculación operacional y aeronave',
  sectionOpsLead: 'Identificación de misión, aeronave y coordenadas cronológicas del evento',
  sectionClass: 'Clasificación de evento y nivel de severidad',
  sectionClassLead: 'Origen del incidente e impacto en la aeronavegabilidad',
  sectionDetail: 'Descripción técnica y síntomas observados',
  sectionDetailLead: 'Detalle de instrumental, comportamiento dinámico y acciones de contingencia',
  sectionCrew: 'Validación de tripulación y evidencia técnica',
  sectionCrewLead: 'Personal al mando, evidencia adjunta y declaración',
  required: 'Requerido',
  riskTag: 'Evaluación de riesgo',
  telemetryTag: 'Telemetría y ATA',
  signaturesTag: 'Firmas digitales',
  missionLabel: 'N.º orden de vuelo / misión',
  missionHint: 'Sincronizado con la misión activa',
  aircraftLabel: 'Aeronave matriculada',
  aircraftHint: 'Aeronave asignada a la misión',
  detectedAtLabel: 'Fecha y hora de detección',
  detectedHint: 'Hora local de la misión',
  sectorLabel: 'Sector aéreo / cuadrante',
  sectorHint: 'Zona de maniobras de instrucción',
  phaseLabel: 'Fase de vuelo en que se manifestó el evento',
  typeLabel: 'Tipo de discrepancia u origen del incidente',
  severityLabel: 'Nivel de severidad y condición de aeronavegabilidad',
  summaryLabel: 'Resumen sintético de la discrepancia',
  summaryHint: 'Máx. 120 caracteres',
  ataLabel: 'Código de sistema ATA 100',
  ataHint: 'Define el taller de mantenimiento destinatario',
  readingLabel: 'Lectura instrumental de cabina',
  readingHint: 'Valor pico o umbral alcanzado',
  cautionLabel: 'Anunciador / precaución',
  cautionHint: 'Código o texto en el panel central',
  descriptionLabel: 'Descripción pormenorizada del comportamiento anómalo',
  descriptionHint: 'Altitud, velocidad, condición de vuelo y secuencia del fallo',
  crewActionLabel: 'Acción correctiva inmediata de la tripulación',
  studentLabel: 'Piloto / alumno reportante',
  instructorLabel: 'Instructor de vuelo a bordo',
  studentSeat: 'Cabina delantera',
  instructorSeat: 'Cabina trasera',
  studentStatus: 'Sesión autenticada',
  instructorStatus: 'Notificación pendiente',
  evidenceLabel: 'Adjuntar evidencia técnica, fotos de instrumentos o datos de vuelo',
  evidenceHint: 'Capturas de panel (JPEG, PNG o WebP). Máximo 2 MB.',
  evidenceEmpty: 'Arrastre archivos o haga clic para examinar',
  declarationTitle: 'Declaración oficial de veracidad técnica',
  declaration:
    'Certifico que la información describe con fidelidad los eventos ocurridos en este vuelo de instrucción y queda sujeta a auditoría operacional.',
  discard: 'Descartar y salir',
  saveDraft: 'Guardar como borrador',
  submit: 'Despachar y notificar incidencia',
  loadError: 'No hemos podido abrir el formulario de incidencia.',
  saveError: 'No hemos podido guardar la incidencia.',
  draftSaved: 'Borrador guardado',
  submitted: 'Incidencia despachada',
  submittedLead: 'El reporte quedó registrado y vinculado a la misión.',
  none: '—',
  boardReport: 'Reportar nueva novedad',
  boardAircraftFilter: 'Aeronave',
  boardFrom: 'Desde',
  boardTo: 'Hasta',
  boardReload: 'Actualizar',
  boardStatusFilter: 'Estado de las incidencias',
  boardLogTitle: 'Incidencias registradas',
  boardEmpty: 'No hay incidencias con ese filtro de fecha, aeronave o estado.',
  boardLoadError: 'No hemos podido cargar las incidencias registradas.',
  boardView: 'Ver',
  boardViewIncident: 'Ver incidencia',
  boardViewAction: 'Ver acción tomada',
  boardFolio: 'Folio',
  boardAircraft: 'Aeronave',
  boardDate: 'Fecha',
  boardSummary: 'Discrepancia',
  boardAction: 'Acción tomada',
  boardState: 'Estado',
  boardLifecycles: {
    draft: 'Borrador',
    registered: 'Registrada',
    deferred: 'Diferida',
    resolved: 'Resuelta',
  },
  boardTakeAction: 'Tomar acción',
  actionTitle: 'Tomar acción sobre la incidencia',
  actionViewTitle: 'Acción tomada',
  actionLead: 'Registra la acción correctiva y el resultado de la incidencia seleccionada.',
  actionViewLead: 'Consulta la acción tomada, el resultado y la nota de seguimiento.',
  actionSave: 'Registrar acción',
  actionSaved: 'Acción registrada',
  actionLoadError: 'No hemos podido cargar la incidencia.',
  actionSaveError: 'No hemos podido guardar la acción.',
  actionWorkshop: 'Nota de seguimiento',
  actionWorkshopHint: 'Diagnóstico de taller o restricción operativa.',
  actionOutcome: 'Resultado',
  actionOutcomes: {
    resolved: 'Resuelta',
    deferred: 'Diferida',
    grounded: 'Aeronave en tierra',
  },
  phases: {
    preflight: 'Inspección pre-vuelo',
    taxi: 'Rodaje / taxi',
    takeoff: 'Despegue / ascenso',
    enroute: 'Vuelo en ruta / maniobras',
    approach: 'Aproximación / aterrizaje',
    postflight: 'Post-vuelo / debriefing',
  },
  types: {
    maintenance: 'Falla técnica de aeronave',
    operational: 'Incidencia operacional / ATC',
    weather: 'Condición meteorológica severa',
    safety: 'Seguridad / peligro aviar (BASH / FOD)',
    procedure: 'Desviación procedimental / instrucción',
  },
  typeTags: {
    maintenance: 'Mantenimiento',
    operational: 'Espacio aéreo',
    weather: 'MET / clima',
    safety: 'Safety',
    procedure: 'Instrucción',
  },
  typeHints: {
    maintenance: 'Aviónica, sistema motriz, hidráulica, instrumentos de cabina o tren de aterrizaje.',
    operational: 'Comunicaciones, incursión de pista, pérdida de separación o radioayuda.',
    weather: 'Turbulencia severa imprevista, windshear, engelamiento o visibilidad marginal.',
    safety: 'Impacto con ave en vuelo o aproximación, objeto extraño en rodadura.',
    procedure: 'Excedencia de parámetros de vuelo durante la maniobra.',
  },
  severities: {
    routine: '1. Rutinaria',
    mel: '2. Menor / MEL',
    aog: '3. Mayor / AOG',
    critical: '4. Crítica / air safety',
  },
  severityHints: {
    routine: 'Sin impacto en seguridad. La aeronave permanece operativa para los siguientes turnos.',
    mel: 'Desperfecto cubierto bajo lista de equipo mínimo. Despachable con limitaciones.',
    aog: 'Aeronave en tierra. Suspensión de vuelos hasta rectificación.',
    critical: 'Riesgo inminente de colisión, pérdida de potencia o emergencia declarada.',
  },
  severityStatus: {
    routine: 'Estado: operativa',
    mel: 'Estado: despacho con restricción',
    aog: 'Estado: en tierra',
    critical: 'Comisión investigadora',
  },
} as const;

export const FLIGHT_INCIDENT_PHASE_OPTIONS: ChoiceOption[] = (
  Object.entries(FLIGHT_INCIDENT_COPY.phases) as [string, string][]
).map(([value, label]) => ({ value, label }));

export const FLIGHT_INCIDENT_TYPE_OPTIONS: ChoiceOption[] = (
  Object.entries(FLIGHT_INCIDENT_COPY.types) as [string, string][]
).map(([value, label]) => ({
  value,
  label,
  hint: FLIGHT_INCIDENT_COPY.typeHints[value as keyof typeof FLIGHT_INCIDENT_COPY.typeHints],
}));

export const FLIGHT_INCIDENT_SEVERITY_OPTIONS: ChoiceOption[] = (
  Object.entries(FLIGHT_INCIDENT_COPY.severities) as [string, string][]
).map(([value, label]) => ({
  value,
  label,
  hint: FLIGHT_INCIDENT_COPY.severityHints[value as keyof typeof FLIGHT_INCIDENT_COPY.severityHints],
}));

export const FLIGHT_INCIDENT_ATA_OPTIONS: ChoiceOption[] = [
  { value: 'ATA-00', label: 'ATA 00 · General / no clasificado' },
  { value: 'ATA-24', label: 'ATA 24 · Sistema eléctrico' },
  { value: 'ATA-27', label: 'ATA 27 · Controles de vuelo primarios' },
  { value: 'ATA-29', label: 'ATA 29 · Poder hidráulico' },
  { value: 'ATA-31', label: 'ATA 31 · Indicación / paneles' },
  { value: 'ATA-32', label: 'ATA 32 · Tren de aterrizaje y frenos' },
  { value: 'ATA-34', label: 'ATA 34 · Navegación y pitot-estática' },
  { value: 'ATA-71', label: 'ATA 71 · Planta motriz' },
];

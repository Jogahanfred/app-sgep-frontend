export const FLIGHT_INCIDENT_PHASES = [
  'preflight',
  'taxi',
  'takeoff',
  'enroute',
  'approach',
  'postflight',
] as const;

export type FlightIncidentPhase = (typeof FLIGHT_INCIDENT_PHASES)[number];

export const FLIGHT_INCIDENT_TYPES = [
  'maintenance',
  'operational',
  'weather',
  'safety',
  'procedure',
] as const;

export type FlightIncidentType = (typeof FLIGHT_INCIDENT_TYPES)[number];

export const FLIGHT_INCIDENT_SEVERITIES = ['routine', 'mel', 'aog', 'critical'] as const;

export type FlightIncidentSeverity = (typeof FLIGHT_INCIDENT_SEVERITIES)[number];

export const FLIGHT_INCIDENT_STATUSES = ['draft', 'submitted'] as const;

export type FlightIncidentStatus = (typeof FLIGHT_INCIDENT_STATUSES)[number];

export interface FlightIncidentEntity {
  id: string;
  folio: string;
  executionId: string;
  missionId: string;
  aircraftId: string;
  detectedAt: string;
  sector: string;
  phase: FlightIncidentPhase;
  incidentType: FlightIncidentType;
  severity: FlightIncidentSeverity;
  summary: string;
  ataCode: string;
  instrumentReading: string;
  caution: string;
  description: string;
  crewAction: string;
  evidenceName: string | null;
  declared: boolean;
  status: FlightIncidentStatus;
  workshopNote: string;
}

export interface FlightIncidentWriteInput {
  executionId: string;
  missionId: string;
  aircraftId: string;
  detectedAt: string;
  sector: string;
  phase: FlightIncidentPhase;
  incidentType: FlightIncidentType;
  severity: FlightIncidentSeverity;
  summary: string;
  ataCode: string;
  instrumentReading: string;
  caution: string;
  description: string;
  crewAction: string;
  evidenceName: string | null;
  declared: boolean;
  status: FlightIncidentStatus;
}

export const FLIGHT_INCIDENT_ACTION_OUTCOMES = ['resolved', 'deferred', 'grounded'] as const;

export type FlightIncidentActionOutcome = (typeof FLIGHT_INCIDENT_ACTION_OUTCOMES)[number];

export interface FlightIncidentActionInput {
  crewAction: string;
  workshopNote: string;
  outcome: FlightIncidentActionOutcome;
}

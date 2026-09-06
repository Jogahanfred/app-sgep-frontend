import { forkJoin, map, Observable } from 'rxjs';
import type { FlightIncidentEntity, FlightIncidentSeverity, FlightIncidentStatus } from '../../domain/entities/flight-incident';
import { displayUserName, loadAcademicCatalog, type AcademicCatalogSnapshot } from '../academic-catalog.snapshot';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import type { FlightIncidentRepository } from '../../ports/flight-incident.repository';

export type FlightIncidentBoardBucket = 'all' | 'critical' | 'mel' | 'closed';

export type FlightIncidentLifecycle = 'draft' | 'registered' | 'deferred' | 'resolved';

export interface FlightIncidentBoardRow {
  id: string;
  folio: string;
  executionId: string;
  occurredOn: string;
  detectedAt: string;
  aircraftId: string;
  aircraftRegistration: string;
  missionLabel: string;
  ataCode: string;
  summary: string;
  description: string;
  crewAction: string;
  reporterName: string;
  severity: FlightIncidentSeverity;
  status: FlightIncidentStatus;
  lifecycle: FlightIncidentLifecycle;
}

export interface FlightIncidentBoard {
  rows: FlightIncidentBoardRow[];
  aircraftOptions: readonly { value: string; label: string }[];
  fleet: {
    total: number;
    operational: number;
    grounded: number;
  };
}

export function incidentOccurredOn(detectedAt: string): string {
  const match = detectedAt.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? '';
}

export function isIncidentInDateRange(detectedAt: string, from: string, to: string): boolean {
  const key = incidentOccurredOn(detectedAt);
  if (!key) return !from && !to;
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}

export function matchesIncidentBucket(severity: FlightIncidentSeverity, bucket: FlightIncidentBoardBucket): boolean {
  if (bucket === 'all') return true;
  if (bucket === 'critical') return severity === 'aog' || severity === 'critical';
  if (bucket === 'mel') return severity === 'mel';
  return severity === 'routine';
}

export function incidentLifecycle(
  status: FlightIncidentStatus,
  severity: FlightIncidentSeverity,
): FlightIncidentLifecycle {
  if (status === 'draft') return 'draft';
  if (severity === 'routine') return 'resolved';
  if (severity === 'mel') return 'deferred';
  return 'registered';
}

export class GetFlightIncidentBoard {
  constructor(
    private readonly incidents: FlightIncidentRepository,
    private readonly catalog: AdminCatalogRepository,
  ) {}

  execute(): Observable<FlightIncidentBoard> {
    return forkJoin({
      incidents: this.incidents.list(),
      snapshot: loadAcademicCatalog(this.catalog),
    }).pipe(map(({ incidents, snapshot }) => toBoard(incidents, snapshot)));
  }
}

function toBoard(incidents: readonly FlightIncidentEntity[], snapshot: AcademicCatalogSnapshot): FlightIncidentBoard {
  const rows = incidents.map((item) => toRow(item, snapshot));
  const operational = snapshot.aircraft.filter((item) => item.operational && item.status === 'active');
  const grounded = snapshot.aircraft.filter((item) => !item.operational && item.status === 'active');
  return {
    rows,
    aircraftOptions: snapshot.aircraft.map((item) => ({ value: item.id, label: item.registration })),
    fleet: {
      total: snapshot.aircraft.length,
      operational: operational.length,
      grounded: grounded.length,
    },
  };
}

function toRow(item: FlightIncidentEntity, snapshot: AcademicCatalogSnapshot): FlightIncidentBoardRow {
  const execution = snapshot.executions.find((row) => row.id === item.executionId);
  const assignment = execution
    ? snapshot.assignments.find((row) => row.id === execution.individualAssignmentId)
    : snapshot.assignments.find((row) => row.missionId === item.missionId);
  const mission = snapshot.missionTypes.find((row) => row.id === item.missionId);
  const aircraft = snapshot.aircraft.find((row) => row.id === item.aircraftId);
  return {
    id: item.id,
    folio: item.folio,
    executionId: item.executionId,
    occurredOn: incidentOccurredOn(item.detectedAt),
    detectedAt: item.detectedAt,
    aircraftId: item.aircraftId,
    aircraftRegistration: aircraft?.registration ?? item.aircraftId,
    missionLabel: mission ? `${mission.code} · ${mission.name}` : item.missionId,
    ataCode: item.ataCode,
    summary: item.summary,
    description: item.description,
    crewAction: item.crewAction,
    reporterName: displayUserName(assignment?.studentId ?? null, snapshot),
    severity: item.severity,
    status: item.status,
    lifecycle: incidentLifecycle(item.status, item.severity),
  };
}

import { defer, Observable } from 'rxjs';
import type { FlightIncidentEntity, FlightIncidentWriteInput } from '../../domain/entities/flight-incident';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import type { FlightIncidentRepository } from '../../ports/flight-incident.repository';

export class CreateFlightIncident {
  constructor(private readonly incidents: FlightIncidentRepository) {}

  execute(input: FlightIncidentWriteInput): Observable<FlightIncidentEntity> {
    return defer(() => {
      if (!input.executionId || !input.missionId || !input.aircraftId) {
        throw new InvalidAdminCatalogError('Falta la misión o la aeronave para registrar la incidencia.');
      }
      if (input.status === 'submitted') {
        if (!input.summary.trim() || !input.description.trim()) {
          throw new InvalidAdminCatalogError('Completa el resumen y la descripción antes de despachar la incidencia.');
        }
        if (!input.declared) {
          throw new InvalidAdminCatalogError('Debes confirmar la declaración de veracidad para despachar la incidencia.');
        }
      }
      return this.incidents.create(input);
    });
  }
}

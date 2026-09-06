import { defer, Observable } from 'rxjs';
import type { FlightIncidentActionInput, FlightIncidentEntity } from '../../domain/entities/flight-incident';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import type { FlightIncidentRepository } from '../../ports/flight-incident.repository';

export class TakeFlightIncidentAction {
  constructor(private readonly incidents: FlightIncidentRepository) {}

  execute(id: string, input: FlightIncidentActionInput): Observable<FlightIncidentEntity> {
    return defer(() => {
      if (!id) {
        throw new InvalidAdminCatalogError('Falta la incidencia para registrar la acción.');
      }
      if (!input.crewAction.trim()) {
        throw new InvalidAdminCatalogError('Describe la acción tomada sobre la incidencia.');
      }
      if (!input.outcome) {
        throw new InvalidAdminCatalogError('Indica el resultado de la acción.');
      }
      return this.incidents.takeAction(id, {
        crewAction: input.crewAction.trim(),
        workshopNote: input.workshopNote.trim(),
        outcome: input.outcome,
      });
    });
  }
}

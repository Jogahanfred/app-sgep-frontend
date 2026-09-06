import { map, Observable } from 'rxjs';
import type { FlightIncidentEntity } from '../../domain/entities/flight-incident';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import type { FlightIncidentRepository } from '../../ports/flight-incident.repository';

export class GetFlightIncident {
  constructor(private readonly incidents: FlightIncidentRepository) {}

  execute(id: string): Observable<FlightIncidentEntity> {
    return this.incidents.getById(id).pipe(
      map((item) => {
        if (!item) {
          throw new InvalidAdminCatalogError('No encontramos esa incidencia.');
        }
        return item;
      }),
    );
  }
}

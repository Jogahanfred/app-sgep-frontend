import { Observable } from 'rxjs';
import type {
  FlightIncidentActionInput,
  FlightIncidentEntity,
  FlightIncidentWriteInput,
} from '../domain/entities/flight-incident';

export interface FlightIncidentRepository {
  list(): Observable<readonly FlightIncidentEntity[]>;
  getById(id: string): Observable<FlightIncidentEntity | null>;
  create(input: FlightIncidentWriteInput): Observable<FlightIncidentEntity>;
  takeAction(id: string, input: FlightIncidentActionInput): Observable<FlightIncidentEntity>;
}

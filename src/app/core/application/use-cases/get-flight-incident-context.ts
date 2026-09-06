import { map, Observable } from 'rxjs';
import type { UserEntity } from '../../domain/entities/admin-catalog';
import { AcademicRecordAccessError } from '../../domain/errors/domain-error';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog } from '../academic-catalog.snapshot';

export interface FlightIncidentContext {
  executionId: string;
  missionId: string;
  missionLabel: string;
  aircraftId: string;
  aircraftLabel: string;
  detectedAt: string;
  sector: string;
  studentName: string;
  instructorName: string;
  missionOptions: readonly { value: string; label: string }[];
  aircraftOptions: readonly { value: string; label: string }[];
}

export class GetFlightIncidentContext {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(executionId: string): Observable<FlightIncidentContext> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        const execution = snapshot.executions.find((item) => item.id === executionId);
        const assignment = execution
          ? snapshot.assignments.find((item) => item.id === execution.individualAssignmentId)
          : null;
        if (!execution || !assignment) {
          throw new AcademicRecordAccessError('No encontramos esa misión para reportar la incidencia.');
        }
        const mission = snapshot.missionTypes.find((item) => item.id === assignment.missionId);
        const selectedAircraft = snapshot.aircraft.find((item) => item.id === execution.aircraftId);
        const student = snapshot.users.find((item) => item.id === assignment.studentId);
        const instructor = snapshot.users.find((item) => item.id === assignment.instructorId);
        const squadron = snapshot.squadrons.find(
          (item) => item.id === (student?.assignedSquadronId ?? instructor?.assignedSquadronId),
        );
        const date = execution.startDate ?? assignment.date;
        const time = execution.startTime ?? '';
        return {
          executionId,
          missionId: assignment.missionId,
          missionLabel: mission ? `${mission.code} · ${mission.name}` : assignment.missionId,
          aircraftId: selectedAircraft?.id ?? snapshot.aircraft[0]?.id ?? '',
          aircraftLabel: selectedAircraft?.registration ?? '',
          detectedAt: [date, time].filter(Boolean).join(' '),
          sector: squadron?.name ?? '',
          studentName: displayName(student),
          instructorName: displayName(instructor),
          missionOptions: snapshot.missionTypes.map((item) => ({
            value: item.id,
            label: `${item.code} · ${item.name}`,
          })),
          aircraftOptions: snapshot.aircraft.map((item) => ({
            value: item.id,
            label: item.registration,
          })),
        };
      }),
    );
  }
}

function displayName(user: UserEntity | undefined): string {
  if (!user) return '';
  return `${user.firstName} ${user.lastName}`.trim();
}

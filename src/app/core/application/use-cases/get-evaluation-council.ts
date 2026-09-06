import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { AcademicRecordAccessError } from '../../domain/errors/domain-error';
import {
  EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD,
  type EvaluationCouncilResolutionOption,
} from '../../domain/constants/evaluation-council.constants';
import {
  councilAverage,
  councilFailedFlights,
  councilMembers,
  defaultCouncilVotes,
  exceedsEvaluationCouncilThreshold,
  failedMissionCount,
  type CouncilFailedFlight,
  type CouncilMember,
  type CouncilVote,
} from '../../domain/services/evaluation-council';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog } from '../academic-catalog.snapshot';
import { assertDossierVisible } from './list-personnel-dossiers';

export interface EvaluationCouncilSession {
  userId: string;
  displayName: string;
  indicative: string | null;
  documentNumber: string;
  programName: string | null;
  specialtyNames: string[];
  unitName: string;
  squadronName: string;
  failedMissions: number;
  threshold: number;
  average: number | null;
  cause: string;
  flights: CouncilFailedFlight[];
  members: CouncilMember[];
  votes: CouncilVote[];
  recommended: EvaluationCouncilResolutionOption;
}

export class GetEvaluationCouncil {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, userId: string): Observable<EvaluationCouncilSession> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        assertDossierVisible(context, userId, snapshot);
        const user = snapshot.users.find((item) => item.id === userId);
        if (!user) throw new AcademicRecordAccessError('No encontramos a ese alumno.');
        const failed = failedMissionCount(userId, snapshot.assignments, snapshot.executions);
        if (!exceedsEvaluationCouncilThreshold(failed)) {
          throw new AcademicRecordAccessError(
            `Este alumno no supera el tope de ${EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD} misiones reprobadas.`,
          );
        }
        const flights = councilFailedFlights(
          userId,
          snapshot.assignments,
          snapshot.executions,
          snapshot.missionTypes,
          snapshot.users,
        );
        const members = councilMembers(snapshot.users, snapshot.roles);
        const enrollment = snapshot.enrollments.find((item) => item.userId === userId && item.status === 'active');
        const program = enrollment ? snapshot.programs.find((item) => item.id === enrollment.programId) : null;
        const last = flights[0];
        return {
          userId,
          displayName: `${user.firstName} ${user.lastName}`.trim(),
          indicative: user.indicative,
          documentNumber: user.documentNumber,
          programName: program?.name ?? null,
          specialtyNames: user.specialtyIds
            .map((id) => snapshot.specialties.find((item) => item.id === id)?.name)
            .filter((item): item is string => !!item),
          unitName: snapshot.units.find((item) => item.id === user.assignedUnitId)?.name ?? '—',
          squadronName: snapshot.squadrons.find((item) => item.id === user.assignedSquadronId)?.name ?? '—',
          failedMissions: failed,
          threshold: EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD,
          average: councilAverage(flights),
          cause: last?.observations || `Acumulación de ${failed} misiones reprobadas (tope: ${EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD}).`,
          flights,
          members,
          votes: defaultCouncilVotes(members),
          recommended: 'reclassify',
        };
      }),
    );
  }
}

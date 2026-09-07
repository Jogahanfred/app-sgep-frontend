import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { AcademicProgramStatus } from '../../domain/entities/academic-record';
import { AcademicRecordAccessError } from '../../domain/errors/domain-error';
import { EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD } from '../../domain/constants/evaluation-council.constants';
import { buildAcademicRecord } from '../../domain/services/academic-progress';
import {
  dossierGradeLabel,
  dossierHoursBreakdown,
  dossierLicenses,
  dossierMissionLog,
  dossierProgramCards,
  dossierResolutions,
  dossierTrajectory,
  studentMissionExecutions,
  unitAndSquadronLabel,
  type DossierHoursBreakdown,
  type DossierLicense,
  type DossierMissionLogRow,
  type DossierProgramCard,
  type DossierResolution,
  type DossierTrajectoryPoint,
} from '../../domain/services/personnel-dossier';
import { exceedsEvaluationCouncilThreshold, failedMissionCount } from '../../domain/services/evaluation-council';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog } from '../academic-catalog.snapshot';
import { assertDossierVisible } from './list-personnel-dossiers';

export interface PersonnelDossierDetail {
  userId: string;
  displayName: string;
  indicative: string | null;
  documentNumber: string;
  photoUrl: string | null;
  rankCode: string;
  specialtyNames: string[];
  promotionName: string | null;
  programName: string | null;
  programs: DossierProgramCard[];
  academicStatus: AcademicProgramStatus | null;
  percentComplete: number | null;
  average: number | null;
  unitName: string;
  squadronName: string;
  hours: DossierHoursBreakdown;
  log: DossierMissionLogRow[];
  licenses: DossierLicense[];
  resolutions: DossierResolution[];
  trajectory: DossierTrajectoryPoint[];
  failedMissions: number;
  councilEligible: boolean;
  failThreshold: number;
}

export class GetPersonnelDossier {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, userId: string): Observable<PersonnelDossierDetail> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        assertDossierVisible(context, userId, snapshot);
        const user = snapshot.users.find((item) => item.id === userId);
        if (!user) throw new AcademicRecordAccessError('No encontramos a ese alumno.');
        const built = buildAcademicRecord({
          user,
          programs: snapshot.programs,
          phases: snapshot.phases,
          subphases: snapshot.subphases,
          assignments: snapshot.assignments,
          executions: snapshot.executions,
          enrollments: snapshot.enrollments,
        });
        const progress = built.progress;
        const program = progress ? snapshot.programs.find((item) => item.id === progress.programId) : null;
        const enrollment = snapshot.enrollments.find(
          (item) => item.userId === userId && item.programId === progress?.programId && item.status === 'active',
        );
        const promotion = enrollment?.promotionId
          ? snapshot.promotions.find((item) => item.id === enrollment.promotionId)
          : null;
        const rows = studentMissionExecutions(userId, snapshot.assignments, snapshot.executions);
        const hours = dossierHoursBreakdown(rows, snapshot.missionTypes);
        const log = dossierMissionLog(rows, snapshot.missionTypes, snapshot.aircraft, snapshot.users);
        const failed = failedMissionCount(userId, snapshot.assignments, snapshot.executions);
        const placement = unitAndSquadronLabel(user, snapshot.units, snapshot.squadrons);
        return {
          userId,
          displayName: `${user.firstName} ${user.lastName}`.trim(),
          indicative: user.indicative,
          documentNumber: user.documentNumber,
          photoUrl: user.photoUrl ?? null,
          rankCode: dossierGradeLabel(user.rankCode),
          specialtyNames: user.specialtyIds
            .map((id) => snapshot.specialties.find((item) => item.id === id)?.name)
            .filter((item): item is string => !!item),
          promotionName: promotion?.name ?? null,
          programName: program?.name ?? null,
          programs: dossierProgramCards({
            user,
            programs: snapshot.programs,
            phases: snapshot.phases,
            subphases: snapshot.subphases,
            assignments: snapshot.assignments,
            executions: snapshot.executions,
            enrollments: snapshot.enrollments,
          }),
          academicStatus: progress?.academicStatus ?? null,
          percentComplete: progress?.percentComplete ?? null,
          average: progress?.average ?? null,
          unitName: placement.unitName,
          squadronName: placement.squadronName,
          hours,
          log,
          licenses: dossierLicenses({
            programName: program?.name ?? null,
            academicStatus: progress?.academicStatus ?? null,
            userStatus: user.status,
            hours,
          }),
          resolutions: dossierResolutions(
            rows,
            snapshot.missionTypes,
            progress?.academicStatus === 'completed',
            program?.name ?? null,
          ),
          trajectory: dossierTrajectory(log),
          failedMissions: failed,
          councilEligible: exceedsEvaluationCouncilThreshold(failed),
          failThreshold: EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD,
        };
      }),
    );
  }
}

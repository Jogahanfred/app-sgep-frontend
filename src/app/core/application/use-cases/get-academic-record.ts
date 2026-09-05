import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type {
  AcademicTimelineKind,
  RecordEntity,
  RecordProgramEntity,
  UserProgressEntity,
} from '../../domain/entities/academic-record';
import type { ProgramEnrollmentStatus } from '../../domain/entities/admin-catalog';
import { AcademicRecordAccessError } from '../../domain/errors/domain-error';
import { enrollmentAllowsAcademicWrite } from '../../domain/services/program-enrollment';
import {
  buildAcademicRecord,
  buildAcademicTimeline,
  cohortRanksByAverage,
} from '../../domain/services/academic-progress';
import { isProgramCulminated } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog } from '../academic-catalog.snapshot';
import { assertStudentVisible } from './list-academic-progress';

export interface AcademicRecordEvaluationView {
  assignmentId: string;
  date: string;
  result: string | null;
  average: number | null;
  instructorName: string | null;
  missionName: string;
}

export interface AcademicRecordProgramView {
  program: RecordProgramEntity;
  programName: string;
  programCode: string;
  academicYear: number | null;
  culminated: boolean;
  rank: number | null;
  completedPhaseNames: string[];
  completedSubphaseNames: string[];
  executedMissionNames: string[];
  evaluations: AcademicRecordEvaluationView[];
  enrollmentStatus: ProgramEnrollmentStatus | null;
  promotionName: string | null;
  closedAt: string | null;
  closeReason: string | null;
  canContinue: boolean;
}

export interface AcademicTimelineView {
  id: string;
  kind: AcademicTimelineKind;
  phaseName: string | null;
}

export interface AcademicRecordDetail {
  userId: string;
  displayName: string;
  indicative: string | null;
  specialtyNames: string[];
  progress: UserProgressEntity | null;
  programName: string | null;
  phaseName: string | null;
  subphaseName: string | null;
  instructorName: string | null;
  record: RecordEntity;
  history: AcademicRecordProgramView[];
  timeline: AcademicTimelineView[];
}

function personName(
  userId: string | null,
  users: { id: string; firstName: string; lastName: string }[],
): string | null {
  if (!userId) return null;
  const user = users.find((item) => item.id === userId);
  return user ? `${user.firstName} ${user.lastName}`.trim() : null;
}

export class GetAcademicRecord {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, userId: string): Observable<AcademicRecordDetail> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        assertStudentVisible(context, userId, snapshot);
        const user = snapshot.users.find((item) => item.id === userId);
        if (!user) throw new AcademicRecordAccessError();
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
        const phase = progress?.currentPhaseId
          ? snapshot.phases.find((item) => item.id === progress.currentPhaseId)
          : null;
        const subphase = progress?.currentSubphaseId
          ? snapshot.subphases.find((item) => item.id === progress.currentSubphaseId)
          : null;
        const phaseBank = phase ? snapshot.phaseBanks.find((item) => item.id === phase.phaseBankId) : null;
        const subphaseBank = subphase
          ? snapshot.subphaseBanks.find((item) => item.id === subphase.subphaseBankId)
          : null;
        const currentRecord = progress
          ? (built.record.programs.find((item) => item.programId === progress.programId) ?? null)
          : (built.record.programs[built.record.programs.length - 1] ?? null);
        const phaseTitle = (phaseId: string | null): string => {
          if (!phaseId) return '';
          const item = snapshot.phases.find((entry) => entry.id === phaseId);
          const bank = item ? snapshot.phaseBanks.find((entry) => entry.id === item.phaseBankId) : null;
          return bank?.name ?? phaseId;
        };
        const ranksByProgram = new Map<string, Map<string, number>>();
        for (const catalogProgram of snapshot.programs) {
          const enrolled = snapshot.enrollments.filter((item) => item.programId === catalogProgram.id && item.status === 'active');
          if (enrolled.length === 0) continue;
          const rows = enrolled.map((item) => {
            const member = snapshot.users.find((entry) => entry.id === item.userId);
            if (!member) {
              return { userId: item.userId, status: 'in-progress' as const, average: null };
            }
            const memberRecord = buildAcademicRecord({
              user: member,
              programs: snapshot.programs,
              phases: snapshot.phases,
              subphases: snapshot.subphases,
              assignments: snapshot.assignments,
              executions: snapshot.executions,
              enrollments: snapshot.enrollments,
            }).record.programs.find((entry) => entry.programId === catalogProgram.id);
            return {
              userId: item.userId,
              status: memberRecord?.status ?? ('in-progress' as const),
              average: memberRecord?.average ?? null,
            };
          });
          ranksByProgram.set(catalogProgram.id, cohortRanksByAverage(rows));
        }
        const timeline = currentRecord
          ? buildAcademicTimeline(currentRecord, snapshot.phases, (phaseId) => phaseTitle(phaseId)).map((event) => ({
              id: event.id,
              kind: event.kind,
              phaseName: event.phaseId ? phaseTitle(event.phaseId) : null,
            }))
          : [];
        return {
          userId,
          displayName: `${user.firstName} ${user.lastName}`.trim(),
          indicative: user.indicative,
          specialtyNames: user.specialtyIds
            .map((id) => snapshot.specialties.find((item) => item.id === id)?.name ?? null)
            .filter((name): name is string => !!name),
          progress,
          programName: program?.name ?? null,
          phaseName: phaseBank?.name ?? null,
          subphaseName: subphaseBank?.name ?? null,
          instructorName: personName(progress?.instructorId ?? null, snapshot.users),
          record: built.record,
          history: built.record.programs.map((item) => {
            const found = snapshot.programs.find((entry) => entry.id === item.programId);
            const enrollment = snapshot.enrollments.find(
              (entry) => entry.userId === userId && entry.programId === item.programId,
            );
            const promotion = enrollment?.promotionId
              ? snapshot.promotions.find((entry) => entry.id === enrollment.promotionId)
              : undefined;
            return {
              program: item,
              programName: found?.name ?? item.programId,
              programCode: found?.code ?? item.programId,
              academicYear: found?.academicYear ?? null,
              culminated: found ? isProgramCulminated(found) : false,
              rank: ranksByProgram.get(item.programId)?.get(userId) ?? null,
              completedPhaseNames: item.completedPhaseIds.map((phaseId) => phaseTitle(phaseId)),
              completedSubphaseNames: item.completedSubphaseIds.map((subphaseId) => {
                const sub = snapshot.subphases.find((entry) => entry.id === subphaseId);
                const bank = sub
                  ? snapshot.subphaseBanks.find((entry) => entry.id === sub.subphaseBankId)
                  : null;
                return bank?.name ?? subphaseId;
              }),
              executedMissionNames: item.executedMissionIds.map((missionId) => {
                const mission = snapshot.missionTypes.find((entry) => entry.id === missionId);
                return mission?.name ?? missionId;
              }),
              evaluations: item.evaluations.map((evaluation) => ({
                assignmentId: evaluation.assignmentId,
                date: evaluation.date,
                result: evaluation.result,
                average: evaluation.average,
                instructorName: personName(evaluation.instructorId, snapshot.users),
                missionName:
                  snapshot.missionTypes.find((entry) => entry.id === evaluation.missionId)?.name ?? evaluation.missionId,
              })),
              enrollmentStatus: enrollment?.status ?? null,
              promotionName: promotion?.name ?? null,
              closedAt: enrollment?.closedAt ?? null,
              closeReason: enrollment?.closeReason ?? null,
              canContinue: enrollment ? enrollmentAllowsAcademicWrite(enrollment.status) : true,
            };
          }),
          timeline,
        };
      }),
    );
  }
}

import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type {
  ProgramEntity,
  ProgramEnrollmentEntity,
  PromotionEntity,
  UserEntity,
} from '../../domain/entities/admin-catalog';
import type { AcademicProgramStatus } from '../../domain/entities/academic-record';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import { canEnrollInProgram } from '../../domain/services/program-enrollment';
import {
  buildAcademicRecord,
  cohortRanksByAverage,
  programOutcome,
  visibleStudentIds,
} from '../../domain/services/academic-progress';
import { isProgramCulminated } from '../../domain/services/admin-catalog';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog, studentIdsInCatalog, type AcademicCatalogSnapshot } from '../academic-catalog.snapshot';

export interface ProgrammingProgramCard {
  program: ProgramEntity;
  enrolledCount: number;
  enrollable: boolean;
}

export interface ProgrammingRosterRow {
  enrollment: ProgramEnrollmentEntity;
  displayName: string;
  indicative: string | null;
  promotionName: string | null;
  academicStatus: AcademicProgramStatus | null;
  outcome: 'passed' | 'failed' | 'in-progress' | null;
  rank: number | null;
  average: number | null;
  specialtyNames: string[];
}

export interface ProgrammingCandidate {
  userId: string;
  displayName: string;
  indicative: string | null;
  enrolled: boolean;
}

export interface ProgrammingBoard {
  needsSquadron: boolean;
  canEnroll: boolean;
  programs: ProgrammingProgramCard[];
  promotions: PromotionEntity[];
  students: UserEntity[];
  roster: ProgrammingRosterRow[];
  candidatesByPromotion: Record<string, ProgrammingCandidate[]>;
}

function promotionInContext(promotion: PromotionEntity, context: OperationalContext): boolean {
  if (!context.unitId) return false;
  if (promotion.unitId !== context.unitId) return false;
  if (context.coversAllSquadrons || !context.squadronId) return true;
  return promotion.squadronId === context.squadronId;
}

function specialtyNamesFor(user: UserEntity | undefined, snapshot: AcademicCatalogSnapshot): string[] {
  if (!user) return [];
  return user.specialtyIds
    .map((id) => snapshot.specialties.find((item) => item.id === id)?.name ?? null)
    .filter((name): name is string => !!name);
}

export class GetProgrammingBoard {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext): Observable<ProgrammingBoard> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        if (operationalContextNeedsSquadronPick(context)) {
          return {
            needsSquadron: true,
            canEnroll: canEnrollInProgram(context.roleCode),
            programs: [],
            promotions: [],
            students: [],
            roster: [],
            candidatesByPromotion: {},
          };
        }
        const visibleIds = new Set(
          visibleStudentIds({
            actorUserId: context.userId,
            roleCode: context.roleCode,
            unitId: context.unitId,
            squadronId: context.squadronId,
            coversAllSquadrons: context.coversAllSquadrons,
            users: snapshot.users,
            studentUserIds: studentIdsInCatalog(snapshot),
          }),
        );
        const canEnroll = canEnrollInProgram(context.roleCode);
        const activeEnrollments = snapshot.enrollments.filter((item) => item.status === 'active');
        const programs = snapshot.programs
          .filter((program) => program.status === 'active' || isProgramCulminated(program))
          .map((program) => ({
            program,
            enrolledCount: activeEnrollments.filter(
              (item) => item.programId === program.id && visibleIds.has(item.userId),
            ).length,
            enrollable: canEnroll && program.status === 'active' && !isProgramCulminated(program),
          }));
        const roster = snapshot.enrollments
          .filter((item) => visibleIds.has(item.userId))
          .map((enrollment) => {
            const user = snapshot.users.find((item) => item.id === enrollment.userId);
            const promotion = enrollment.promotionId
              ? snapshot.promotions.find((item) => item.id === enrollment.promotionId)
              : undefined;
            const built = user
              ? buildAcademicRecord({
                  user,
                  programs: snapshot.programs,
                  phases: snapshot.phases,
                  subphases: snapshot.subphases,
                  assignments: snapshot.assignments,
                  executions: snapshot.executions,
                  enrollments: snapshot.enrollments,
                })
              : null;
            const record = built?.record.programs.find((item) => item.programId === enrollment.programId) ?? null;
            return {
              enrollment,
              displayName: user ? `${user.firstName} ${user.lastName}`.trim() : enrollment.userId,
              indicative: user?.indicative ?? null,
              promotionName: promotion?.name ?? null,
              academicStatus: record?.status ?? null,
              outcome: record ? programOutcome(record.status) : null,
              rank: null as number | null,
              average: record?.average ?? null,
              specialtyNames: specialtyNamesFor(user, snapshot),
            };
          });
        const byProgram = new Map<string, ProgrammingRosterRow[]>();
        for (const row of roster) {
          const list = byProgram.get(row.enrollment.programId) ?? [];
          list.push(row);
          byProgram.set(row.enrollment.programId, list);
        }
        for (const rows of byProgram.values()) {
          const ranks = cohortRanksByAverage(
            rows.map((item) => ({
              userId: item.enrollment.userId,
              status: item.academicStatus ?? 'in-progress',
              average: item.average,
            })),
          );
          for (const row of rows) {
            row.rank = ranks.get(row.enrollment.userId) ?? null;
          }
        }
        const promotions = snapshot.promotions.filter((item) => promotionInContext(item, context));
        const candidatesByPromotion: Record<string, ProgrammingCandidate[]> = {};
        for (const promotion of promotions) {
          const members = snapshot.members.filter((item) => item.promotionId === promotion.id);
          candidatesByPromotion[promotion.id] = members
            .filter((item) => visibleIds.has(item.userId))
            .map((item) => {
              const user = snapshot.users.find((entry) => entry.id === item.userId);
              return {
                userId: item.userId,
                displayName: user ? `${user.firstName} ${user.lastName}`.trim() : item.userId,
                indicative: user?.indicative ?? null,
                enrolled: false,
              };
            });
        }
        return {
          needsSquadron: false,
          canEnroll,
          programs,
          promotions,
          students: snapshot.users.filter((user) => visibleIds.has(user.id)),
          roster,
          candidatesByPromotion,
        };
      }),
    );
  }
}

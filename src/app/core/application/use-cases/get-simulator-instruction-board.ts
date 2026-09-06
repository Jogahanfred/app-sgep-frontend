import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { ProgramEnrollmentEntity } from '../../domain/entities/admin-catalog';
import { canDispatchMission } from '../../domain/services/mission-dispatch';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import { visibleStudentIds } from '../../domain/services/academic-progress';
import { simulatorSessionRecords, simulatorSubphaseSyllabus } from '../../domain/services/simulator-instruction-grade';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog, studentIdsInCatalog, type AcademicCatalogSnapshot } from '../academic-catalog.snapshot';

export interface SimulatorInstructionProgramOption {
  id: string;
  code: string;
  name: string;
}

export interface SimulatorInstructionPromotionOption {
  id: string;
  name: string;
  year: number;
  programIds: string[];
}

export interface SimulatorInstructionSessionCard {
  id: string;
  code: string;
  name: string;
  hours: number;
  missionCount: number;
  requirement: string;
  enrolled: number;
  pending: number;
  completed: number;
}

export interface SimulatorInstructionOffering {
  programId: string;
  promotionId: string;
  studentCount: number;
  pending: number;
  completed: number;
  sessions: SimulatorInstructionSessionCard[];
}

export interface SimulatorInstructionBoard {
  needsSquadron: boolean;
  canGrade: boolean;
  programs: SimulatorInstructionProgramOption[];
  promotions: SimulatorInstructionPromotionOption[];
  offerings: SimulatorInstructionOffering[];
}

function promotionInContext(
  promotion: { unitId: string; squadronId: string },
  context: OperationalContext,
): boolean {
  if (!context.unitId) return false;
  if (promotion.unitId !== context.unitId) return false;
  if (context.coversAllSquadrons || !context.squadronId) return true;
  return promotion.squadronId === context.squadronId;
}

export function programSimulatorSessions(
  snapshot: AcademicCatalogSnapshot,
  programId: string,
): { id: string; code: string; name: string; hours: number; missionCount: number }[] {
  const phaseIds = snapshot.phases
    .filter((phase) => phase.programId === programId && phase.moduleKind === 'simulator')
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((phase) => phase.id);
  return snapshot.subphases
    .filter((item) => phaseIds.includes(item.phaseId))
    .slice()
    .sort((a, b) => {
      const phaseA = phaseIds.indexOf(a.phaseId);
      const phaseB = phaseIds.indexOf(b.phaseId);
      if (phaseA !== phaseB) return phaseA - phaseB;
      return a.sortOrder - b.sortOrder;
    })
    .map((item) => {
      const bank = snapshot.subphaseBanks.find((entry) => entry.id === item.subphaseBankId);
      const syllabus = simulatorSubphaseSyllabus(item, snapshot.missionTypes);
      return {
        id: item.id,
        code: bank?.code ?? item.subphaseBankId,
        name: bank?.name ?? item.subphaseBankId,
        hours: item.hours,
        missionCount: syllabus.length,
      };
    });
}

function sessionStats(
  enrollments: readonly ProgramEnrollmentEntity[],
  subphaseId: string,
  snapshot: AcademicCatalogSnapshot,
): { enrolled: number; pending: number; completed: number } {
  const subphase = snapshot.subphases.find((item) => item.id === subphaseId);
  const syllabus = subphase ? simulatorSubphaseSyllabus(subphase, snapshot.missionTypes) : [];
  let enrolled = 0;
  let pending = 0;
  let completed = 0;
  for (const enrollment of enrollments) {
    enrolled += 1;
    const records = simulatorSessionRecords(enrollment.simulatorEvaluations ?? [], subphaseId, syllabus);
    if (syllabus.length && records.every((item) => item.status === 'completed')) completed += 1;
    else if (records.some((item) => item.status === 'available')) pending += 1;
  }
  return { enrolled, pending, completed };
}

export class GetSimulatorInstructionBoard {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext): Observable<SimulatorInstructionBoard> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        if (operationalContextNeedsSquadronPick(context)) {
          return { needsSquadron: true, canGrade: false, programs: [], promotions: [], offerings: [] };
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
        const simulatorPrograms = snapshot.programs.filter(
          (program) => programSimulatorSessions(snapshot, program.id).length > 0,
        );
        const enrollments = snapshot.enrollments.filter(
          (item) => item.status === 'active' && visibleIds.has(item.userId) && item.promotionId,
        );
        const offerings: SimulatorInstructionOffering[] = [];
        const programIds = new Set<string>();
        const promotionIds = new Set<string>();
        const promotionProgramIds = new Map<string, Set<string>>();

        for (const program of simulatorPrograms) {
          const catalog = programSimulatorSessions(snapshot, program.id);
          const byPromotion = new Map<string, ProgramEnrollmentEntity[]>();
          for (const enrollment of enrollments.filter((item) => item.programId === program.id && item.promotionId)) {
            const list = byPromotion.get(enrollment.promotionId!) ?? [];
            list.push(enrollment);
            byPromotion.set(enrollment.promotionId!, list);
          }
          for (const [promotionId, group] of byPromotion) {
            const promotion = snapshot.promotions.find((item) => item.id === promotionId);
            if (!promotion || !promotionInContext(promotion, context)) continue;
            const sessions = catalog.map((session, index) => {
              const stats = sessionStats(group, session.id, snapshot);
              const previous = catalog[index - 1];
              return {
                id: session.id,
                code: session.code,
                name: session.name,
                hours: session.hours,
                missionCount: session.missionCount,
                requirement: previous ? previous.name : 'No tiene requisitos',
                enrolled: stats.enrolled,
                pending: stats.pending,
                completed: stats.completed,
              };
            });
            offerings.push({
              programId: program.id,
              promotionId,
              studentCount: group.length,
              pending: sessions.reduce((total, item) => total + item.pending, 0),
              completed: sessions.reduce((total, item) => total + item.completed, 0),
              sessions,
            });
            programIds.add(program.id);
            promotionIds.add(promotionId);
            const linked = promotionProgramIds.get(promotionId) ?? new Set<string>();
            linked.add(program.id);
            promotionProgramIds.set(promotionId, linked);
          }
        }

        return {
          needsSquadron: false,
          canGrade: canDispatchMission(context.roleCode),
          programs: simulatorPrograms
            .filter((program) => programIds.has(program.id))
            .map((program) => ({ id: program.id, code: program.code, name: program.name })),
          promotions: snapshot.promotions
            .filter((promotion) => promotionIds.has(promotion.id))
            .map((promotion) => ({
              id: promotion.id,
              name: promotion.name,
              year: promotion.year,
              programIds: [...(promotionProgramIds.get(promotion.id) ?? [])],
            })),
          offerings,
        };
      }),
    );
  }
}

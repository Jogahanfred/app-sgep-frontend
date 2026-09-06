import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { ProgramEnrollmentEntity } from '../../domain/entities/admin-catalog';
import { canDispatchMission } from '../../domain/services/mission-dispatch';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import { visibleStudentIds } from '../../domain/services/academic-progress';
import { groundCourseRecords, groundSubjectSyllabus } from '../../domain/services/ground-instruction-grade';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog, studentIdsInCatalog, type AcademicCatalogSnapshot } from '../academic-catalog.snapshot';

export interface GroundInstructionProgramOption {
  id: string;
  code: string;
  name: string;
}

export interface GroundInstructionPromotionOption {
  id: string;
  name: string;
  year: number;
  programIds: string[];
}

export interface GroundInstructionCourseCard {
  id: string;
  code: string;
  name: string;
  hours: number;
  credits: number;
  theoryHours: number;
  labHours: number;
  otherHours: number;
  requirement: string;
  enrolled: number;
  pending: number;
  completed: number;
}

export interface GroundInstructionOffering {
  programId: string;
  promotionId: string;
  studentCount: number;
  pending: number;
  completed: number;
  courses: GroundInstructionCourseCard[];
}

export interface GroundInstructionBoard {
  needsSquadron: boolean;
  canGrade: boolean;
  programs: GroundInstructionProgramOption[];
  promotions: GroundInstructionPromotionOption[];
  offerings: GroundInstructionOffering[];
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

export function programGroundCourses(
  snapshot: AcademicCatalogSnapshot,
  programId: string,
): { id: string; code: string; name: string; hours: number; bankCode: string }[] {
  const phaseIds = snapshot.phases
    .filter((phase) => phase.programId === programId && phase.moduleKind === 'ground')
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
      return {
        id: item.id,
        code: bank?.code ?? item.subphaseBankId,
        name: bank?.name ?? item.subphaseBankId,
        hours: item.hours,
        bankCode: bank?.code ?? '',
      };
    });
}

export function assignedGroundCourseIds(
  enrollment: ProgramEnrollmentEntity,
  catalogIds: readonly string[],
): string[] {
  if (!enrollment.groundCourseIds) return [...catalogIds];
  return enrollment.groundCourseIds.filter((id) => catalogIds.includes(id));
}

function courseStats(
  enrollments: readonly ProgramEnrollmentEntity[],
  courseId: string,
  bankCode: string,
): { enrolled: number; pending: number; completed: number } {
  const syllabus = groundSubjectSyllabus(bankCode);
  let enrolled = 0;
  let pending = 0;
  let completed = 0;
  for (const enrollment of enrollments) {
    enrolled += 1;
    const records = groundCourseRecords(enrollment.groundEvaluations ?? [], courseId, syllabus);
    if (records.every((item) => item.status === 'completed')) completed += 1;
    else if (records.some((item) => item.status === 'available')) pending += 1;
  }
  return { enrolled, pending, completed };
}

export class GetGroundInstructionBoard {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext): Observable<GroundInstructionBoard> {
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
        const groundPrograms = snapshot.programs.filter((program) => programGroundCourses(snapshot, program.id).length > 0);
        const enrollments = snapshot.enrollments.filter(
          (item) => item.status === 'active' && visibleIds.has(item.userId) && item.promotionId,
        );
        const offerings: GroundInstructionOffering[] = [];
        const programIds = new Set<string>();
        const promotionIds = new Set<string>();
        const promotionProgramIds = new Map<string, Set<string>>();

        for (const program of groundPrograms) {
          const catalog = programGroundCourses(snapshot, program.id);
          const catalogIds = catalog.map((item) => item.id);
          const byPromotion = new Map<string, ProgramEnrollmentEntity[]>();
          for (const enrollment of enrollments.filter((item) => item.programId === program.id && item.promotionId)) {
            const list = byPromotion.get(enrollment.promotionId!) ?? [];
            list.push(enrollment);
            byPromotion.set(enrollment.promotionId!, list);
          }
          for (const [promotionId, group] of byPromotion) {
            const promotion = snapshot.promotions.find((item) => item.id === promotionId);
            if (!promotion || !promotionInContext(promotion, context)) continue;
            const courses = catalog.map((course, index) => {
              const loaded = group.filter((enrollment) => assignedGroundCourseIds(enrollment, catalogIds).includes(course.id));
              const stats = courseStats(loaded, course.id, course.bankCode);
              const previous = catalog[index - 1];
              const theoryHours = Math.ceil(course.hours / 2);
              const otherHours = course.hours - theoryHours;
              return {
                id: course.id,
                code: course.code,
                name: course.name,
                hours: course.hours,
                credits: Math.max(1, Math.round(course.hours / 5)),
                theoryHours,
                labHours: 0,
                otherHours,
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
              pending: courses.reduce((total, item) => total + item.pending, 0),
              completed: courses.reduce((total, item) => total + item.completed, 0),
              courses,
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
          programs: groundPrograms
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

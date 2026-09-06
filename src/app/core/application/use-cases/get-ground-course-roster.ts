import { map, Observable, throwError } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { GroundEvaluationRecord } from '../../domain/entities/admin-catalog';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { canDispatchMission } from '../../domain/services/mission-dispatch';
import { operationalContextNeedsSquadronPick } from '../../domain/services/profile-context-policy';
import { visibleStudentIds } from '../../domain/services/academic-progress';
import { enrollmentAllowsAcademicWrite } from '../../domain/services/program-enrollment';
import {
  GROUND_ASSESSMENT_LABEL,
  groundCourseRecords,
  groundSheetCode,
  groundSubjectSyllabus,
  type GroundSyllabusItem,
} from '../../domain/services/ground-instruction-grade';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog, studentIdsInCatalog } from '../academic-catalog.snapshot';
import { assignedGroundCourseIds, programGroundCourses } from './get-ground-instruction-board';

export interface GroundCourseAssessmentView {
  code: string;
  sheetCode: string;
  name: string;
  kindLabel: string;
  status: GroundEvaluationRecord['status'];
  grade: number | null;
}

export interface GroundCourseStudentRow {
  enrollmentId: string;
  userId: string;
  displayName: string;
  indicative: string | null;
  canGrade: boolean;
  progress: number;
  average: number | null;
  pendingCount: number;
  assessments: GroundCourseAssessmentView[];
}

export interface GroundCourseRoster {
  needsSquadron: boolean;
  canGrade: boolean;
  programId: string;
  programName: string;
  promotionId: string;
  promotionName: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  hours: number;
  assessments: GroundSyllabusItem[];
  students: GroundCourseStudentRow[];
}

function personName(
  userId: string,
  users: { id: string; firstName: string; lastName: string; indicative: string | null }[],
): { displayName: string; indicative: string | null } {
  const user = users.find((item) => item.id === userId);
  return {
    displayName: user ? `${user.firstName} ${user.lastName}`.trim() : userId,
    indicative: user?.indicative ?? null,
  };
}

function assessmentsFor(
  syllabus: readonly GroundSyllabusItem[],
  records: readonly GroundEvaluationRecord[],
): GroundCourseAssessmentView[] {
  const byCode = new Map(records.map((item) => [item.code, item]));
  return syllabus.map((item, index) => {
    const recorded = byCode.get(item.code);
    return {
      code: item.code,
      sheetCode: groundSheetCode(syllabus, index),
      name: item.name,
      kindLabel: GROUND_ASSESSMENT_LABEL[item.kind],
      status: recorded?.status ?? 'available',
      grade: recorded?.grade ?? null,
    };
  });
}

export class GetGroundCourseRoster {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(
    context: OperationalContext,
    input: { programId: string; promotionId: string; courseId: string },
  ): Observable<GroundCourseRoster> {
    if (operationalContextNeedsSquadronPick(context)) {
      return throwError(() => new InvalidAdminCatalogError('Selecciona un escuadrón en el encabezado para calificar.'));
    }
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        const program = snapshot.programs.find((item) => item.id === input.programId);
        const promotion = snapshot.promotions.find((item) => item.id === input.promotionId);
        const catalog = programGroundCourses(snapshot, input.programId);
        const course = catalog.find((item) => item.id === input.courseId);
        if (!program || !promotion || !course) {
          throw new InvalidAdminCatalogError('No encontramos ese curso en tierra.');
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
        const catalogIds = catalog.map((item) => item.id);
        const syllabus = groundSubjectSyllabus(course.bankCode);
        const canGradeRole = canDispatchMission(context.roleCode);
        const students = snapshot.enrollments
          .filter(
            (enrollment) =>
              enrollment.programId === input.programId &&
              enrollment.promotionId === input.promotionId &&
              enrollment.status === 'active' &&
              visibleIds.has(enrollment.userId) &&
              assignedGroundCourseIds(enrollment, catalogIds).includes(course.id),
          )
          .map((enrollment) => {
            const records = groundCourseRecords(enrollment.groundEvaluations ?? [], course.id, syllabus);
            const views = assessmentsFor(syllabus, records);
            const completed = views.filter((item) => item.status === 'completed');
            const grades = completed.map((item) => item.grade).filter((value): value is number => value !== null);
            const person = personName(enrollment.userId, snapshot.users);
            return {
              enrollmentId: enrollment.id,
              userId: enrollment.userId,
              displayName: person.displayName,
              indicative: person.indicative,
              canGrade: canGradeRole && enrollmentAllowsAcademicWrite(enrollment.status),
              progress: syllabus.length ? Math.round((completed.length / syllabus.length) * 100) : 0,
              average: grades.length ? Math.round((grades.reduce((sum, value) => sum + value, 0) / grades.length) * 10) / 10 : null,
              pendingCount: views.filter((item) => item.status === 'available').length,
              assessments: views,
            };
          })
          .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'));
        return {
          needsSquadron: false,
          canGrade: canGradeRole,
          programId: program.id,
          programName: program.name,
          promotionId: promotion.id,
          promotionName: promotion.name,
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          hours: course.hours,
          assessments: [...syllabus],
          students,
        };
      }),
    );
  }
}

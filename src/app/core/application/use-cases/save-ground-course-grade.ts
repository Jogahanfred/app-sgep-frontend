import { Observable, switchMap, throwError } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { ProgramEnrollmentEntity } from '../../domain/entities/admin-catalog';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { canDispatchMission } from '../../domain/services/mission-dispatch';
import { enrollmentAllowsAcademicWrite } from '../../domain/services/program-enrollment';
import { applyGroundAssessmentGrade, groundSubjectSyllabus } from '../../domain/services/ground-instruction-grade';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog } from '../academic-catalog.snapshot';
import { assignedGroundCourseIds, programGroundCourses } from './get-ground-instruction-board';

export interface SaveGroundCourseGradeInput {
  enrollmentId: string;
  courseId: string;
  code: string;
  grade: number;
}

export class SaveGroundCourseGrade {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, input: SaveGroundCourseGradeInput): Observable<ProgramEnrollmentEntity> {
    if (!canDispatchMission(context.roleCode)) {
      return throwError(() => new InvalidAdminCatalogError('Tu rol no puede calificar cursos en tierra.'));
    }
    return loadAcademicCatalog(this.catalog).pipe(
      switchMap((snapshot) => {
        const enrollment = snapshot.enrollments.find((item) => item.id === input.enrollmentId);
        if (!enrollment) {
          return throwError(() => new InvalidAdminCatalogError('No encontramos esa matrícula.'));
        }
        if (!enrollmentAllowsAcademicWrite(enrollment.status)) {
          return throwError(() => new InvalidAdminCatalogError('La matrícula no admite nuevas evaluaciones.'));
        }
        const catalog = programGroundCourses(snapshot, enrollment.programId);
        const course = catalog.find((item) => item.id === input.courseId);
        if (!course || !assignedGroundCourseIds(enrollment, catalog.map((item) => item.id)).includes(course.id)) {
          return throwError(() => new InvalidAdminCatalogError('El alumno no tiene cargado ese curso.'));
        }
        try {
          const groundEvaluations = applyGroundAssessmentGrade(
            enrollment.groundEvaluations ?? [],
            course.id,
            groundSubjectSyllabus(course.bankCode),
            input.code,
            input.grade,
          );
          return this.catalog.saveEnrollmentGroundEvaluations(enrollment.id, groundEvaluations);
        } catch (error) {
          return throwError(() => error);
        }
      }),
    );
  }
}

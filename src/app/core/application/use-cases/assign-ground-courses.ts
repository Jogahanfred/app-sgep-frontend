import { Observable, switchMap, throwError } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type { ProgramEnrollmentEntity, SubphaseEntity } from '../../domain/entities/admin-catalog';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { canDispatchMission } from '../../domain/services/mission-dispatch';
import {
  assertGroundCourseIds,
  assertStudentCanReceiveAssignment,
  enrollmentAllowsAcademicWrite,
} from '../../domain/services/program-enrollment';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog, type AcademicCatalogSnapshot } from '../academic-catalog.snapshot';

export interface AssignGroundCoursesInput {
  enrollmentId: string;
  groundCourseIds: readonly string[];
}

function programGroundCourseIds(snapshot: AcademicCatalogSnapshot, programId: string): string[] {
  const phaseIds = new Set(
    snapshot.phases.filter((phase) => phase.programId === programId && phase.moduleKind === 'ground').map((phase) => phase.id),
  );
  return snapshot.subphases.filter((item: SubphaseEntity) => phaseIds.has(item.phaseId)).map((item) => item.id);
}

export class AssignGroundCourses {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, input: AssignGroundCoursesInput): Observable<ProgramEnrollmentEntity> {
    if (!canDispatchMission(context.roleCode)) {
      return throwError(() => new InvalidAdminCatalogError('Tu rol no puede cargar cursos de tierra al alumno.'));
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
        try {
          assertStudentCanReceiveAssignment(snapshot.enrollments, enrollment.userId, enrollment.programId);
          const allowed = programGroundCourseIds(snapshot, enrollment.programId);
          const groundCourseIds = assertGroundCourseIds(input.groundCourseIds, allowed);
          return this.catalog.saveEnrollmentGroundCourses(enrollment.id, groundCourseIds);
        } catch (error) {
          return throwError(() => error);
        }
      }),
    );
  }
}

import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { AcademicRecordAccessError } from '../../domain/errors/domain-error';
import { buildDossierCurriculum, type DossierCurriculum } from '../../domain/services/personnel-dossier';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog } from '../academic-catalog.snapshot';
import { assertDossierVisible } from './list-personnel-dossiers';

export type { DossierCurriculum };

export class GetPersonnelDossierCurriculum {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, userId: string, programId: string): Observable<DossierCurriculum> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => {
        assertDossierVisible(context, userId, snapshot);
        const user = snapshot.users.find((item) => item.id === userId);
        if (!user) throw new AcademicRecordAccessError('No encontramos a ese alumno.');
        const curriculum = buildDossierCurriculum(userId, programId, {
          user,
          programs: snapshot.programs,
          phases: snapshot.phases,
          subphases: snapshot.subphases,
          assignments: snapshot.assignments,
          executions: snapshot.executions,
          enrollments: snapshot.enrollments,
          phaseBanks: snapshot.phaseBanks,
          subphaseBanks: snapshot.subphaseBanks,
          missionTypes: snapshot.missionTypes,
        });
        if (!curriculum) {
          throw new AcademicRecordAccessError('No encontramos ese programa en el expediente.');
        }
        return curriculum;
      }),
    );
  }
}

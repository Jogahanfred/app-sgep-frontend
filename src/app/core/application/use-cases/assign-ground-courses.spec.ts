import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { HELICOPTER_OPTIONAL_GROUND_COURSE_IDS } from '../../adapters/mock/helicopter-program.data';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { GROUND_ASSESSMENT_LABEL } from '../../domain/services/ground-instruction-grade';
import { AssignGroundCourses } from './assign-ground-courses';
import { GetFlightOrderBoard } from './get-flight-order-board';

const norteAlfa: OperationalContext = {
  userId: 'usr-elena-martin',
  displayName: 'Elena Martín Ruiz',
  roleCode: 'ADSYS',
  assignedUnitId: null,
  assignedSquadronId: null,
  unitId: 'unit-norte',
  squadronId: 'sq-alfa',
  coversAllSquadrons: false,
};

describe('AssignGroundCourses', () => {
  it('carga Matemática en el expediente del alumno', async () => {
    const catalog = new MockAdminCatalogRepository();
    const assign = new AssignGroundCourses(catalog);
    const boardBefore = await firstValueFrom(new GetFlightOrderBoard(catalog).execute(norteAlfa));
    const natalia = boardBefore.trainees.find((item) => item.userId === 'usr-natalia-rey-cubero');
    expect(natalia?.groundCourses.some((item) => item.name === 'Matemática' && item.loaded)).toBe(false);
    const nextIds = [...(natalia?.groundCourseIds ?? []), HELICOPTER_OPTIONAL_GROUND_COURSE_IDS[0]];
    await firstValueFrom(assign.execute(norteAlfa, { enrollmentId: natalia!.enrollmentId, groundCourseIds: nextIds }));
    const boardAfter = await firstValueFrom(new GetFlightOrderBoard(catalog).execute(norteAlfa));
    const loaded = boardAfter.trainees.find((item) => item.userId === 'usr-natalia-rey-cubero');
    expect(loaded?.groundCourses.some((item) => item.name === 'Matemática' && item.loaded)).toBe(true);
    const math = loaded?.curriculum.phases
      .flatMap((phase) => phase.subphases)
      .find((item) => item.name === 'Matemática');
    expect(math?.missions.map((item) => item.name)).toEqual([
      `${GROUND_ASSESSMENT_LABEL.exam} 1`,
      `${GROUND_ASSESSMENT_LABEL.exam} 2`,
      GROUND_ASSESSMENT_LABEL.partial,
      GROUND_ASSESSMENT_LABEL.final,
      GROUND_ASSESSMENT_LABEL.talk,
    ]);
  });

  it('rechaza al piloto', async () => {
    const catalog = new MockAdminCatalogRepository();
    await expect(
      firstValueFrom(
        new AssignGroundCourses(catalog).execute(
          { ...norteAlfa, roleCode: 'PILOT', userId: 'usr-diego-molina' },
          { enrollmentId: 'enrollment-natalia-heli', groundCourseIds: [] },
        ),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });
});

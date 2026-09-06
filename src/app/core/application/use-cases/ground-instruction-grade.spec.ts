import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { GetGroundCourseRoster } from './get-ground-course-roster';
import { GetGroundInstructionBoard } from './get-ground-instruction-board';
import { SaveGroundCourseGrade } from './save-ground-course-grade';

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

describe('calificación de cursos en tierra', () => {
  it('lista programas, promociones y cursos con alumnos matriculados', async () => {
    const board = await firstValueFrom(new GetGroundInstructionBoard(new MockAdminCatalogRepository()).execute(norteAlfa));
    expect(board.needsSquadron).toBe(false);
    expect(board.canGrade).toBe(true);
    expect(board.programs.some((item) => item.id === 'prg-ppl')).toBe(true);
    expect(board.promotions.some((item) => item.id === 'promotion-2026-i')).toBe(true);
    const offering = board.offerings.find(
      (item) => item.programId === 'prg-ppl' && item.promotionId === 'promotion-2026-i',
    );
    expect(offering?.studentCount).toBeGreaterThan(0);
    expect(offering?.courses.some((item) => item.code === 'TEA' && item.enrolled > 0 && item.requirement === 'No tiene requisitos')).toBe(true);
    expect(offering?.courses.some((item) => item.code === 'OPV' && item.pending > 0)).toBe(true);
  });

  it('expone el acta del curso con evaluaciones por alumno', async () => {
    const roster = await firstValueFrom(
      new GetGroundCourseRoster(new MockAdminCatalogRepository()).execute(norteAlfa, {
        programId: 'prg-ppl',
        promotionId: 'promotion-2026-i',
        courseId: 'sp-ppl-opv',
      }),
    );
    expect(roster.courseName).toBe('Operaciones de Vuelo');
    expect(roster.promotionName).toBe('Promoción 2026-I');
    const ivan = roster.students.find((item) => item.userId === 'usr-ivan-rubio-nadal');
    expect(ivan?.assessments.find((item) => item.code === 'PAR')?.sheetCode).toBe('EP');
    expect(ivan?.assessments.find((item) => item.code === 'FIN')?.sheetCode).toBe('EX');
    expect(ivan?.assessments.find((item) => item.code === 'PAR')?.status).toBe('available');
    expect(ivan?.assessments.find((item) => item.code === 'FIN')?.status).toBe('blocked');
    expect(roster.students.some((item) => item.userId === 'usr-teresa-gil-pascual')).toBe(false);
  });

  it('guarda la nota y desbloquea la siguiente prueba', async () => {
    const catalog = new MockAdminCatalogRepository();
    const rosterBefore = await firstValueFrom(
      new GetGroundCourseRoster(catalog).execute(norteAlfa, {
        programId: 'prg-ppl',
        promotionId: 'promotion-2026-i',
        courseId: 'sp-ppl-opv',
      }),
    );
    const ivan = rosterBefore.students.find((item) => item.userId === 'usr-ivan-rubio-nadal');
    await firstValueFrom(
      new SaveGroundCourseGrade(catalog).execute(norteAlfa, {
        enrollmentId: ivan!.enrollmentId,
        courseId: 'sp-ppl-opv',
        code: 'PAR',
        grade: 16,
      }),
    );
    const rosterAfter = await firstValueFrom(
      new GetGroundCourseRoster(catalog).execute(norteAlfa, {
        programId: 'prg-ppl',
        promotionId: 'promotion-2026-i',
        courseId: 'sp-ppl-opv',
      }),
    );
    const updated = rosterAfter.students.find((item) => item.userId === 'usr-ivan-rubio-nadal');
    expect(updated?.assessments.find((item) => item.code === 'PAR')).toMatchObject({ status: 'completed', grade: 16 });
    expect(updated?.assessments.find((item) => item.code === 'FIN')?.status).toBe('available');
  });

  it('rechaza al piloto', async () => {
    await expect(
      firstValueFrom(
        new SaveGroundCourseGrade(new MockAdminCatalogRepository()).execute(
          { ...norteAlfa, roleCode: 'PILOT', userId: 'usr-diego-molina' },
          { enrollmentId: 'enrollment-ivan-ppl', courseId: 'sp-ppl-opv', code: 'PAR', grade: 16 },
        ),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });
});

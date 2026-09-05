import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { buildAcademicRecord } from '../../domain/services/academic-progress';
import { CloseProgramEnrollment } from './close-program-enrollment';
import { CreateIndividualAssignment } from './create-individual-assignment';
import { EnrollInProgram } from './enroll-in-program';
import { GetProgrammingBoard } from './get-programming-board';
import type { OperationalContext } from '../../domain/entities/operational-context';

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

describe('matriculación en programa', () => {
  it('lista programas de alta y el roster visible del contexto', async () => {
    const board = await firstValueFrom(new GetProgrammingBoard(new MockAdminCatalogRepository()).execute(norteAlfa));
    expect(board.needsSquadron).toBe(false);
    expect(board.canEnroll).toBe(true);
    expect(board.programs.some((item) => item.program.code === 'PDI-HELI-2023')).toBe(true);
    expect(board.programs.find((item) => item.program.id === 'prg-heli-2023')?.enrollable).toBe(false);
    expect(board.roster.some((item) => item.enrollment.userId === 'usr-sofia-vidal')).toBe(true);
    const sofia = board.roster.find((item) => item.enrollment.userId === 'usr-sofia-vidal' && item.enrollment.programId === 'prg-heli-2023');
    expect(sofia?.outcome).toBe('passed');
    expect(sofia?.rank).toBe(1);
    expect(sofia?.specialtyNames).toContain('Pilotaje');
    const diego = board.roster.find((item) => item.enrollment.userId === 'usr-diego-molina');
    expect(diego?.outcome).toBe('failed');
    expect(diego?.rank).toBeNull();
    expect(board.promotions.some((item) => item.id === 'promotion-2025-alfa')).toBe(true);
    expect(board.promotions.some((item) => item.id === 'promotion-2026-i')).toBe(true);
    expect(board.roster.some((item) => item.enrollment.userId === 'usr-teresa-gil-pascual' && item.enrollment.status === 'dropped')).toBe(true);
    expect(
      board.candidatesByPromotion['promotion-2026-i']?.some((item) => item.userId === 'usr-beatriz-cano-riera'),
    ).toBe(true);
  });

  it('matricula a un alumno y abre su legajo del programa', async () => {
    const repo = new MockAdminCatalogRepository();
    const created = await firstValueFrom(
      new EnrollInProgram(repo).execute({
        programId: 'prg-ppl',
        source: 'individual',
        promotionId: null,
        userId: 'usr-diego-molina',
        enrolledAt: '2026-03-02',
      }),
    );
    expect(created).toHaveLength(1);
    expect(created[0].userId).toBe('usr-diego-molina');
    const users = await firstValueFrom(repo.listUsers());
    const diego = users.find((item) => item.id === 'usr-diego-molina');
    const programs = await firstValueFrom(repo.listPrograms());
    const enrollments = await firstValueFrom(repo.listProgramEnrollments());
    const built = buildAcademicRecord({
      user: diego!,
      programs,
      phases: await firstValueFrom(repo.listPhases()),
      subphases: await firstValueFrom(repo.listSubphases()),
      assignments: await firstValueFrom(repo.listIndividualAssignments()),
      executions: await firstValueFrom(repo.listMissionExecutions()),
      enrollments,
    });
    expect(built.record.programs.some((item) => item.programId === 'prg-ppl')).toBe(true);
    expect(built.progress?.academicStatus).toBe('in-progress');
    expect(enrollments.find((item) => item.userId === 'usr-diego-molina' && item.programId === 'prg-ppl')?.enrolledAt).toBe(
      '2026-03-02',
    );
  });

  it('rechaza matricular en un programa ya calificado', async () => {
    const repo = new MockAdminCatalogRepository();
    await expect(
      firstValueFrom(
        new EnrollInProgram(repo).execute({
          programId: 'prg-heli-2023',
          source: 'individual',
          promotionId: null,
          userId: 'usr-sofia-vidal',
          enrolledAt: '2026-03-02',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('rechaza matricular dos veces al mismo alumno', async () => {
    const repo = new MockAdminCatalogRepository();
    await firstValueFrom(
      new EnrollInProgram(repo).execute({
        programId: 'prg-ppl',
        source: 'individual',
        promotionId: null,
        userId: 'usr-diego-molina',
        enrolledAt: '2026-03-02',
      }),
    );
    await expect(
      firstValueFrom(
        new EnrollInProgram(repo).execute({
          programId: 'prg-ppl',
          source: 'individual',
          promotionId: null,
          userId: 'usr-diego-molina',
          enrolledAt: '2026-03-03',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('matricula una promoción seleccionada sin crear misiones', async () => {
    const repo = new MockAdminCatalogRepository();
    const before = (await firstValueFrom(repo.listIndividualAssignments())).length;
    const created = await firstValueFrom(
      new EnrollInProgram(repo).execute({
        programId: 'prg-ppl',
        source: 'promotion',
        promotionId: 'promotion-2026-i',
        userId: null,
        userIds: ['usr-beatriz-cano-riera'],
        enrolledAt: '2026-03-02',
      }),
    );
    expect(created).toHaveLength(1);
    expect(created[0].userId).toBe('usr-beatriz-cano-riera');
    expect(created[0].promotionId).toBe('promotion-2026-i');
    expect((await firstValueFrom(repo.listIndividualAssignments())).length).toBe(before);
  });

  it('da de baja y bloquea una nueva misión', async () => {
    const repo = new MockAdminCatalogRepository();
    const closed = await firstValueFrom(
      new CloseProgramEnrollment(repo).execute('enrollment-ivan-ppl', {
        status: 'dropped',
        closedAt: '2026-09-04',
        closeReason: 'Incumplimiento académico',
      }),
    );
    expect(closed.status).toBe('dropped');
    await expect(
      firstValueFrom(
        new CreateIndividualAssignment(repo).execute({
          assignmentCase: 'pdi',
          studentId: 'usr-ivan-rubio-nadal',
          externalPerson: null,
          programId: 'prg-ppl',
          missionId: 'mt-local',
          instructorId: 'usr-pablo-nunez',
          date: '2026-09-10',
          status: 'scheduled',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
    await expect(
      firstValueFrom(
        new CreateIndividualAssignment(repo).execute({
          assignmentCase: 'pdi',
          studentId: 'usr-teresa-gil-pascual',
          externalPerson: null,
          programId: 'prg-ppl',
          missionId: 'mt-local',
          instructorId: 'usr-pablo-nunez',
          date: '2026-09-10',
          status: 'scheduled',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });
});

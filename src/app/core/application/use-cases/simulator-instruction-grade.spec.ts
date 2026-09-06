import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { catalogMissionKey } from '../../domain/services/admin-catalog';
import { GetSimulatorInstructionBoard } from './get-simulator-instruction-board';
import { GetSimulatorSessionRoster } from './get-simulator-session-roster';
import { SaveSimulatorSessionGrade } from './save-simulator-session-grade';

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

describe('calificación de simulador', () => {
  it('lista programas, promociones y sesiones de simulador', async () => {
    const board = await firstValueFrom(new GetSimulatorInstructionBoard(new MockAdminCatalogRepository()).execute(norteAlfa));
    expect(board.needsSquadron).toBe(false);
    expect(board.canGrade).toBe(true);
    expect(board.programs.some((item) => item.id === 'prg-ppl')).toBe(true);
    const offering = board.offerings.find(
      (item) => item.programId === 'prg-ppl' && item.promotionId === 'promotion-2026-i',
    );
    expect(offering?.sessions.some((item) => item.code === 'SIM' && item.missionCount > 0)).toBe(true);
  });

  it('expone el acta de la sesión y guarda una nota numérica', async () => {
    const catalog = new MockAdminCatalogRepository();
    const rosterBefore = await firstValueFrom(
      new GetSimulatorSessionRoster(catalog).execute(norteAlfa, {
        programId: 'prg-ppl',
        promotionId: 'promotion-2026-i',
        sessionId: 'sp-ppl-sim-proc',
      }),
    );
    expect(rosterBefore.sessionName).toBe('Simulador');
    const ivan = rosterBefore.students.find((item) => item.userId === 'usr-ivan-rubio-nadal');
    const first = ivan?.assessments[0];
    expect(first?.code).toBe(catalogMissionKey('mt-local'));
    await firstValueFrom(
      new SaveSimulatorSessionGrade(catalog).execute(norteAlfa, {
        enrollmentId: ivan!.enrollmentId,
        sessionId: 'sp-ppl-sim-proc',
        code: first!.code,
        grade: 16,
      }),
    );
    const rosterAfter = await firstValueFrom(
      new GetSimulatorSessionRoster(catalog).execute(norteAlfa, {
        programId: 'prg-ppl',
        promotionId: 'promotion-2026-i',
        sessionId: 'sp-ppl-sim-proc',
      }),
    );
    const updated = rosterAfter.students.find((item) => item.userId === 'usr-ivan-rubio-nadal');
    expect(updated?.assessments.find((item) => item.code === first!.code)).toMatchObject({
      status: 'completed',
      grade: 16,
    });
  });

  it('rechaza al piloto', async () => {
    await expect(
      firstValueFrom(
        new SaveSimulatorSessionGrade(new MockAdminCatalogRepository()).execute(
          { ...norteAlfa, roleCode: 'PILOT', userId: 'usr-diego-molina' },
          {
            enrollmentId: 'enrollment-ivan-ppl',
            sessionId: 'sp-ppl-sim-proc',
            code: catalogMissionKey('mt-local'),
            grade: 16,
          },
        ),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });
});

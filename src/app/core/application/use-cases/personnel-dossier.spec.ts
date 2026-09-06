import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD } from '../../domain/constants/evaluation-council.constants';
import { GetPersonnelDossier } from './get-personnel-dossier';
import { GetPersonnelDossierCurriculum } from './get-personnel-dossier-curriculum';
import { ListPersonnelDossiers } from './list-personnel-dossiers';

const adsys: OperationalContext = {
  userId: 'usr-elena-martin',
  displayName: 'Elena Martín Ruiz',
  roleCode: 'ADSYS',
  assignedUnitId: null,
  assignedSquadronId: null,
  unitId: 'unit-norte',
  squadronId: 'sq-alfa',
  coversAllSquadrons: false,
};

describe('legajo personal', () => {
  it('lista alumnos del contexto con horas de bitácora', async () => {
    const board = await firstValueFrom(new ListPersonnelDossiers(new MockAdminCatalogRepository()).execute(adsys));
    expect(board.needsSquadron).toBe(false);
    const sofia = board.rows.find((row) => row.userId === 'usr-sofia-vidal');
    expect(sofia?.firstName).toBe('Sofía');
    expect(sofia?.lastName).toContain('Vidal');
    expect(sofia?.serial).toMatch(/^O-\d{5}-[ABO]+[+-]$/);
    expect(sofia?.expiresOn).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(sofia?.hours).toBeGreaterThan(0);
    expect(board.rows.some((row) => row.userId === 'usr-diego-molina')).toBe(true);
  });

  it('arma el expediente con bitácora y tope de consejo', async () => {
    const detail = await firstValueFrom(
      new GetPersonnelDossier(new MockAdminCatalogRepository()).execute(adsys, 'usr-diego-molina'),
    );
    expect(detail.documentNumber).toBe('81204567D');
    expect(detail.log.length).toBeGreaterThan(0);
    expect(detail.failedMissions).toBeGreaterThanOrEqual(EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD);
    expect(detail.councilEligible).toBe(true);
    expect(detail.failThreshold).toBe(EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD);
    expect(detail.photoUrl).toBe('/portraits/diego.jpg');
    expect(detail.programs.length).toBeGreaterThan(0);
  });

  it('arma el currículo de un programa con fases y misiones', async () => {
    const curriculum = await firstValueFrom(
      new GetPersonnelDossierCurriculum(new MockAdminCatalogRepository()).execute(adsys, 'usr-sofia-vidal', 'prg-heli-2023'),
    );
    expect(curriculum.programName).toContain('Helicóptero');
    expect(curriculum.phases.length).toBeGreaterThan(0);
    expect(curriculum.phases.some((phase) => phase.subphases.some((sub) => sub.missions.length > 0))).toBe(true);
  });
});

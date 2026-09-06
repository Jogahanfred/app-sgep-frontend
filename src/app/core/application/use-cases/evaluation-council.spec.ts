import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD } from '../../domain/constants/evaluation-council.constants';
import { GetEvaluationCouncil } from './get-evaluation-council';
import { ListEvaluationCouncils } from './list-evaluation-councils';

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

describe('consejo de evaluación', () => {
  it('lista solo alumnos que superan el tope de misiones reprobadas', async () => {
    const board = await firstValueFrom(new ListEvaluationCouncils(new MockAdminCatalogRepository()).execute(adsys));
    expect(board.threshold).toBe(EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD);
    expect(board.rows.every((row) => row.failedMissions >= board.threshold)).toBe(true);
    expect(board.rows.some((row) => row.userId === 'usr-diego-molina')).toBe(true);
    expect(board.rows.some((row) => row.userId === 'usr-sofia-vidal')).toBe(false);
  });

  it('abre la sesión del alumno con vuelos reprobados y tribunal del catálogo', async () => {
    const session = await firstValueFrom(
      new GetEvaluationCouncil(new MockAdminCatalogRepository()).execute(adsys, 'usr-diego-molina'),
    );
    expect(session.flights.length).toBeGreaterThanOrEqual(EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD);
    expect(session.members).toHaveLength(5);
    expect(session.members[0]?.displayName).toContain('Herrera');
    expect(session.votes.some((vote) => vote.option === 'reclassify')).toBe(true);
  });
});

import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { CancelDispatchSlot, StartMissionDispatch } from './start-mission-dispatch';

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

describe('StartMissionDispatch', () => {
  it('pasa la ejecución a en curso', async () => {
    const repo = new MockAdminCatalogRepository();
    const updated = await firstValueFrom(new StartMissionDispatch(repo).execute(norteAlfa, 'execution-dispatch-ready'));
    expect(updated.status).toBe('in-progress');
    const assignments = await firstValueFrom(repo.listIndividualAssignments());
    expect(assignments.find((item) => item.id === 'dispatch-as-ready')?.status).toBe('in-progress');
  });

  it('rechaza al piloto', async () => {
    await expect(
      firstValueFrom(
        new StartMissionDispatch(new MockAdminCatalogRepository()).execute({ ...norteAlfa, roleCode: 'PILOT' }, 'execution-dispatch-ready'),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });
});

describe('CancelDispatchSlot', () => {
  it('cancela un slot programado', async () => {
    const repo = new MockAdminCatalogRepository();
    await firstValueFrom(new CancelDispatchSlot(repo).execute(norteAlfa, 'dispatch-as-pending', 'Cancelado desde el despacho diario.'));
    const assignments = await firstValueFrom(repo.listIndividualAssignments());
    expect(assignments.find((item) => item.id === 'dispatch-as-pending')?.status).toBe('cancelled');
  });
});

import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { isoCalendarDate } from './get-dashboard-overview';
import { GetDailyDispatchBoard } from './get-daily-dispatch-board';

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

describe('GetDailyDispatchBoard', () => {
  it('lista los slots del día y marca el primero listo para despacho', async () => {
    const board = await firstValueFrom(new GetDailyDispatchBoard(new MockAdminCatalogRepository()).execute(norteAlfa, isoCalendarDate()));
    expect(board.needsSquadron).toBe(false);
    expect(board.canDispatch).toBe(true);
    expect(board.totals.scheduled).toBe(14);
    expect(board.totals.airborne).toBe(3);
    expect(board.totals.closed).toBe(8);
    expect(board.totals.ready).toBe(1);
    const ready = board.slots.find((item) => item.kind === 'ready');
    expect(ready?.assignmentId).toBe('dispatch-as-ready');
    expect(ready?.studentName).toContain('Diego Molina');
    expect(board.slots.some((item) => item.kind === 'airborne' && item.assignmentId === 'dispatch-as-airborne')).toBe(true);
    expect(board.slots.some((item) => item.kind === 'closed' && item.assignmentId === 'dispatch-as-closed')).toBe(true);
    expect(board.slots.some((item) => item.assignmentId === 'dispatch-as-pending' && item.kind === 'pending')).toBe(true);
  });

  it('no despacha con rol de piloto', async () => {
    const board = await firstValueFrom(
      new GetDailyDispatchBoard(new MockAdminCatalogRepository()).execute({ ...norteAlfa, roleCode: 'PILOT', userId: 'usr-diego-molina' }, isoCalendarDate()),
    );
    expect(board.canDispatch).toBe(false);
  });
});

import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { ALL_SQUADRONS_CONTEXT_VALUE } from '../../domain/entities/operational-context';
import { InvalidProfileContextError } from '../../domain/errors/domain-error';
import { ConfirmProfileContext } from './confirm-profile-context';
import { GetProfileContext } from './get-profile-context';

describe('perfilamiento operacional', () => {
  it('carga requisitos de ADSYS con unidades seleccionables', async () => {
    const snapshot = await firstValueFrom(new GetProfileContext(new MockAdminCatalogRepository()).execute('usr-elena-martin'));
    expect(snapshot.roleCode).toBe('ADSYS');
    expect(snapshot.requirements.allowUnitChange).toBe(true);
    expect(snapshot.units.some((unit) => unit.id === 'unit-norte')).toBe(true);
  });

  it('confirma el contexto de un piloto con asignación fija', async () => {
    const context = await firstValueFrom(
      new ConfirmProfileContext(new MockAdminCatalogRepository()).execute('usr-sofia-vidal', {
        unitId: 'unit-sur',
        squadronId: 'sq-delta',
      }),
    );
    expect(context.roleCode).toBe('PILOT');
    expect(context.unitId).toBe('unit-norte');
    expect(context.squadronId).toBe('sq-alfa');
  });

  it('exige unidad para ADSYS', async () => {
    await expect(
      firstValueFrom(
        new ConfirmProfileContext(new MockAdminCatalogRepository()).execute('usr-elena-martin', {
          unitId: null,
          squadronId: ALL_SQUADRONS_CONTEXT_VALUE,
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidProfileContextError);
  });
});

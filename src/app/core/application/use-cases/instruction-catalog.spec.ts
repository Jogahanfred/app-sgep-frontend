import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { CreateManeuver } from './create-maneuver';
import { CreateMissionType } from './create-mission-type';
import { CreateOperation } from './create-operation';
import { CreateStandard } from './create-standard';
import { CreateWeighting } from './create-weighting';
import { ListOperations } from './list-operations';
import { ListStandards } from './list-standards';

describe('catálogos de instrucción', () => {
  it('lista las operaciones de ejemplo', async () => {
    const items = await firstValueFrom(new ListOperations(new MockAdminCatalogRepository()).execute());
    expect(items.map((item) => item.name)).toEqual(['Vuelo visual', 'Vuelo instrumental', 'Navegación', 'Emergencias']);
  });

  it('crea una operación y rechaza un nombre repetido', async () => {
    const repo = new MockAdminCatalogRepository();
    const created = await firstValueFrom(
      new CreateOperation(repo).execute({ name: 'Formación en tierra', description: 'Briefing y debriefing.', status: 'active' }),
    );
    expect(created.name).toBe('Formación en tierra');
    await expect(
      firstValueFrom(new CreateOperation(repo).execute({ name: 'Vuelo visual', description: '', status: 'active' })),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('normaliza el código del tipo de misión', async () => {
    const created = await firstValueFrom(
      new CreateMissionType(new MockAdminCatalogRepository()).execute({
        code: 'x-nav',
        name: 'Navegación extendida',
        description: '',
      }),
    );
    expect(created.code).toBe('X-NAV');
  });

  it('exige una operación existente para la maniobra', async () => {
    await expect(
      firstValueFrom(
        new CreateManeuver(new MockAdminCatalogRepository()).execute({
          operationId: 'op-fantasma',
          code: 'SPIN',
          name: 'Barrena',
          description: '',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('ordena el listado de estándares y valida el orden', async () => {
    const listed = await firstValueFrom(new ListStandards(new MockAdminCatalogRepository()).execute());
    expect(listed[0].sortOrder).toBe(10);
    await expect(
      firstValueFrom(
        new CreateStandard(new MockAdminCatalogRepository()).execute({
          code: 'BAD-01',
          name: 'Inválido',
          description: '',
          sortOrder: 0,
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('crea una ponderación y rechaza escuadrón de otra unidad', async () => {
    const repo = new MockAdminCatalogRepository();
    const created = await firstValueFrom(
      new CreateWeighting(repo).execute({
        standardId: 'std-toff',
        unitId: 'unit-sur',
        squadronId: 'sq-sur',
        program: 'CPL',
        weightedValue: 18,
        validFrom: '2026-09-01',
        validTo: '2027-08-31',
      }),
    );
    expect(created.weightedValue).toBe(18);
    await expect(
      firstValueFrom(
        new CreateWeighting(repo).execute({
          standardId: 'std-toff',
          unitId: 'unit-norte',
          squadronId: 'sq-sur',
          program: 'PPL',
          weightedValue: 10,
          validFrom: '2026-09-01',
          validTo: '2027-08-31',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });
});

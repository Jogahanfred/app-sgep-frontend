import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { CreateSquadron } from './create-squadron';
import { CreateTemporaryCommission } from './create-temporary-commission';
import { CreateUnit } from './create-unit';
import { ListSquadrons } from './list-squadrons';
import { ListTemporaryCommissions } from './list-temporary-commissions';
import { ListUnits } from './list-units';

describe('estructura operativa', () => {
  it('lista las unidades de ejemplo', async () => {
    const units = await firstValueFrom(new ListUnits(new MockAdminCatalogRepository()).execute());
    expect(units.map((unit) => unit.code)).toEqual(['U-NORTE', 'U-SUR', 'U-ACA', 'U-PLT', 'GA-51', 'GA-8']);
  });

  it('crea una unidad y rechaza un código repetido', async () => {
    const repo = new MockAdminCatalogRepository();
    const created = await firstValueFrom(
      new CreateUnit(repo).execute({
        code: 'u-este',
        name: 'Base Este',
        abbreviation: 'be',
        status: 'active',
      }),
    );
    expect(created.code).toBe('U-ESTE');
    expect(created.abbreviation).toBe('BE');
    await expect(
      firstValueFrom(new CreateUnit(repo).execute({ code: 'U-NORTE', name: 'Otra', abbreviation: 'XX', status: 'active' })),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('lista escuadrones y exige una unidad existente', async () => {
    const repo = new MockAdminCatalogRepository();
    const squadrons = await firstValueFrom(new ListSquadrons(repo).execute());
    expect(squadrons.some((item) => item.code === 'ESC-A')).toBe(true);
    await expect(
      firstValueFrom(
        new CreateSquadron(repo).execute({
          unitId: 'unit-fantasma',
          code: 'ESC-Z',
          name: 'Escuadrón Zulu',
          description: '',
          status: 'active',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('crea una comisión y rechaza destino igual a origen', async () => {
    const repo = new MockAdminCatalogRepository();
    const listed = await firstValueFrom(new ListTemporaryCommissions(repo).execute());
    expect(listed.map((item) => item.status)).toContain('registered');
    const created = await firstValueFrom(
      new CreateTemporaryCommission(repo).execute({
        userId: 'usr-diego-herrera',
        originUnitId: 'unit-academia',
        destinationUnitId: 'unit-sur',
        startDate: '2026-09-01',
        endDate: '2026-09-20',
        reason: 'Relevo de dirección en Base Sur.',
        status: 'registered',
      }),
    );
    expect(created.status).toBe('registered');
    await expect(
      firstValueFrom(
        new CreateTemporaryCommission(repo).execute({
          userId: 'usr-diego-herrera',
          originUnitId: 'unit-norte',
          destinationUnitId: 'unit-norte',
          startDate: '2026-09-01',
          endDate: '2026-09-20',
          reason: 'Mismo sitio',
          status: 'registered',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });
});

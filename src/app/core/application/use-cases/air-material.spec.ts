import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { CreateAircraft } from './create-aircraft';
import { CreateFleet } from './create-fleet';
import { ListAircraft } from './list-aircraft';
import { ListFleets } from './list-fleets';

describe('gestión de material aéreo', () => {
  it('lista las flotas de ejemplo', async () => {
    const items = await firstValueFrom(new ListFleets(new MockAdminCatalogRepository()).execute());
    expect(items.map((item) => item.code)).toEqual(['C152', 'C172', 'PA28', 'R44', 'UAS-1', 'PA34']);
  });

  it('crea una flota y rechaza un código repetido', async () => {
    const repo = new MockAdminCatalogRepository();
    const created = await firstValueFrom(
      new CreateFleet(repo).execute({
        fleetType: 'fixed-wing',
        code: 'da40',
        name: 'Diamond DA40',
        description: 'Transición glass cockpit.',
        status: 'active',
      }),
    );
    expect(created.code).toBe('DA40');
    await expect(
      firstValueFrom(
        new CreateFleet(repo).execute({
          fleetType: 'fixed-wing',
          code: 'C152',
          name: 'Otra',
          description: '',
          status: 'active',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('lista aeronaves con imagen y matrícula', async () => {
    const items = await firstValueFrom(new ListAircraft(new MockAdminCatalogRepository()).execute());
    expect(items[0].registration).toBe('EC-HVA');
    expect(items.every((item) => item.imageUrl.startsWith('/aircraft/'))).toBe(true);
  });

  it('normaliza la matrícula y rechaza una unidad inexistente', async () => {
    const repo = new MockAdminCatalogRepository();
    const created = await firstValueFrom(
      new CreateAircraft(repo).execute({
        unitId: 'unit-norte',
        fleetId: 'fleet-c152',
        registration: 'ec-hvx',
        operational: true,
        status: 'active',
        imageUrl: '/aircraft/ec-hva.jpg',
      }),
    );
    expect(created.registration).toBe('EC-HVX');
    await expect(
      firstValueFrom(
        new CreateAircraft(repo).execute({
          unitId: 'unit-fantasma',
          fleetId: 'fleet-c152',
          registration: 'EC-HVY',
          operational: true,
          status: 'active',
          imageUrl: '/aircraft/ec-hva.jpg',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('exige una imagen para registrar la aeronave', async () => {
    await expect(
      firstValueFrom(
        new CreateAircraft(new MockAdminCatalogRepository()).execute({
          unitId: 'unit-norte',
          fleetId: 'fleet-c152',
          registration: 'EC-HVZ',
          operational: true,
          status: 'active',
          imageUrl: '',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });
});

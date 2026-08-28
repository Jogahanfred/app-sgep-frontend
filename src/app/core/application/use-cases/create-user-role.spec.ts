import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { CreateSpecialty } from './create-specialty';
import { CreateUserRole } from './create-user-role';
import { ListUserRoles } from './list-user-roles';

describe('roles y especialidades', () => {
  it('lista los roles de ejemplo', async () => {
    const roles = await firstValueFrom(new ListUserRoles(new MockAdminCatalogRepository()).execute());
    expect(roles.map((role) => role.name)).toEqual([
      'Administrador',
      'Director Académico',
      'Jefe de Instrucción',
      'Instructor',
      'Alumno',
    ]);
  });

  it('crea un rol nuevo', async () => {
    const created = await firstValueFrom(
      new CreateUserRole(new MockAdminCatalogRepository()).execute({
        name: 'Coordinador',
        description: 'Apoya al jefe de instrucción en turnos.',
        status: 'active',
      }),
    );
    expect(created.name).toBe('Coordinador');
  });

  it('rechaza un rol con el mismo nombre', async () => {
    const useCase = new CreateUserRole(new MockAdminCatalogRepository());
    await expect(
      firstValueFrom(useCase.execute({ name: 'Administrador', description: '', status: 'active' })),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('crea una especialidad', async () => {
    const created = await firstValueFrom(
      new CreateSpecialty(new MockAdminCatalogRepository()).execute({
        name: 'Meteorología',
        description: 'Lectura de cartas y briefing meteorológico.',
        status: 'active',
      }),
    );
    expect(created.name).toBe('Meteorología');
  });
});

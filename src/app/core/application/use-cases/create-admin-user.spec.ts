import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { CreateAdminUser } from './create-admin-user';
import { ListAdminUsers } from './list-admin-users';
import { UpdateAdminUser } from './update-admin-user';

function write(overrides: Record<string, unknown> = {}) {
  return {
    firstName: 'Nuria',
    lastName: 'Beltrán Cano',
    email: 'nuria.beltran@siga.demo',
    password: 'Nueva.clave1',
    documentNumber: '99887766A',
    entryDate: '2026-08-01',
    indicative: 'INS-99',
    status: 'active' as const,
    roleIds: ['role-instructor'],
    specialtyIds: ['spc-pilot', 'spc-flight-inst'],
    ...overrides,
  };
}

describe('CreateAdminUser / UpdateAdminUser', () => {
  it('crea un usuario y persiste especialidades', async () => {
    const repo = new MockAdminCatalogRepository();
    const created = await firstValueFrom(new CreateAdminUser(repo).execute(write()));
    expect(created.firstName).toBe('Nuria');
    expect(created.specialtyIds).toEqual(['spc-pilot', 'spc-flight-inst']);

    const rows = await firstValueFrom(repo.listSpecialtyUsers());
    expect(rows.some((row) => row.userId === created.id && row.specialtyId === 'spc-pilot')).toBe(true);
  });

  it('rechaza un correo duplicado', async () => {
    const useCase = new CreateAdminUser(new MockAdminCatalogRepository());
    await expect(
      firstValueFrom(useCase.execute(write({ email: 'elena.martin@correo.helvia.demo', documentNumber: '11111111A' }))),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('actualiza estado y quita especialidades', async () => {
    const repo = new MockAdminCatalogRepository();
    const listed = await firstValueFrom(new ListAdminUsers(repo).execute());
    const elena = listed.find((user) => user.id === 'usr-elena-martin');
    expect(elena).toBeTruthy();

    const updated = await firstValueFrom(
      new UpdateAdminUser(repo).execute('usr-elena-martin', {
        firstName: elena!.firstName,
        lastName: elena!.lastName,
        email: elena!.email,
        documentNumber: elena!.documentNumber,
        entryDate: elena!.entryDate,
        indicative: elena!.indicative ?? '',
        status: 'inactive',
        roleIds: elena!.roleIds,
        specialtyIds: [],
      }),
    );
    expect(updated.status).toBe('inactive');
    expect(updated.specialtyIds).toEqual([]);
    const rows = await firstValueFrom(repo.listSpecialtyUsers());
    expect(rows.some((row) => row.userId === 'usr-elena-martin')).toBe(false);
  });
});

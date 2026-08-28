import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { SESSION_DEMO_USER_ID } from '../../domain/entities';
import { GetAdminUser } from './get-admin-user';

describe('GetAdminUser', () => {
  it('devuelve la ficha de la persona logueada de demostración', async () => {
    const user = await firstValueFrom(new GetAdminUser(new MockAdminCatalogRepository()).execute(SESSION_DEMO_USER_ID));
    expect(user.firstName).toBe('Elena');
    expect(user.roleIds).toContain('role-admin');
    expect(user.specialtyIds).toContain('spc-academic');
  });
});

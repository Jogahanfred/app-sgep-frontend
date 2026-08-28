import { describe, expect, it } from 'vitest';
import { InvalidAdminCatalogError } from '../errors/domain-error';
import { assertCatalogWrite, assertUserWrite, matchesAdminSearch, passwordStrengthError } from './admin-catalog';

const validUser = {
  firstName: 'Ana',
  lastName: 'Gil Soto',
  email: 'ana.gil@siga.demo',
  password: 'Clave.segura1',
  documentNumber: '12345678Z',
  entryDate: '2026-01-15',
  indicative: 'ALU-01',
  status: 'active' as const,
  roleIds: ['role-student'],
  specialtyIds: ['spc-pilot'],
};

describe('admin-catalog domain', () => {
  it('normaliza correo, documento e indicativo', () => {
    const result = assertUserWrite(
      { ...validUser, email: 'Ana.Gil@Siga.Demo', documentNumber: '12345678z', indicative: 'ALU-01' },
      true,
    );
    expect(result.email).toBe('ana.gil@siga.demo');
    expect(result.documentNumber).toBe('12345678Z');
    expect(result.indicative).toBe('ALU-01');
  });

  it('describe el error de contraseña sin lanzar si no es alta', () => {
    expect(passwordStrengthError('', false)).toBeUndefined();
    expect(passwordStrengthError('corta', true)).toMatch(/8 caracteres/);
  });

  it('exige contraseña en el alta', () => {
    expect(() => assertUserWrite({ ...validUser, password: '' }, true)).toThrow(InvalidAdminCatalogError);
  });

  it('permite editar sin tocar la contraseña', () => {
    const result = assertUserWrite({ ...validUser, password: '' }, false);
    expect(result.password).toBeUndefined();
  });

  it('rechaza un indicativo con espacios', () => {
    expect(() => assertUserWrite({ ...validUser, indicative: 'ALU 01' }, true)).toThrow(/indicativo/i);
  });

  it('exige el nombre del rol', () => {
    expect(() => assertCatalogWrite({ name: '  ', description: '', status: 'active' }, 'del rol')).toThrow(
      /nombre del rol/,
    );
  });

  it('filtra por buscador global', () => {
    expect(matchesAdminSearch(['Elena', 'Martín', '25198467M'], 'martin')).toBe(true);
    expect(matchesAdminSearch(['Elena', 'Martín'], 'pablo')).toBe(false);
  });
});

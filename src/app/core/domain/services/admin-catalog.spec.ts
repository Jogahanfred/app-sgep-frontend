import { describe, expect, it } from 'vitest';
import { InvalidAdminCatalogError } from '../errors/domain-error';
import { AUTO_MISSION_COUNT_MAX } from '../entities/admin-catalog';
import {
  assertCatalogWrite,
  assertPhaseBankWrite,
  assertSubphaseDraft,
  expandAutoMissions,
  assertProgramWrite,
  assertUserWrite,
  matchesAdminSearch,
  passwordStrengthError,
  programTypeLabel,
} from './admin-catalog';

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

  it('normaliza el código del programa y nombra el tipo', () => {
    const result = assertProgramWrite({
      code: 'ppl-af',
      name: 'Piloto privado',
      programType: 'PPL',
      description: '  ',
      status: 'active',
    });
    expect(result.code).toBe('PPL-AF');
    expect(result.description).toBe('');
    expect(result.imageUrl).toBe('/programs/ppl.jpg');
    expect(programTypeLabel('IR')).toMatch(/instrumental/i);
  });

  it('normaliza el código del banco de fase', () => {
    const result = assertPhaseBankWrite({
      code: 'nav',
      name: 'Navegación',
      description: '  Travesía  ',
      status: 'active',
    });
    expect(result.code).toBe('NAV');
    expect(result.description).toBe('Travesía');
  });

  it('genera la serie automática C1 a C17 desde CER y 17', () => {
    const items = expandAutoMissions('CER', 17);
    expect(items[0]).toBe('C1');
    expect(items[1]).toBe('C2');
    expect(items[16]).toBe('C17');
    expect(items).toHaveLength(17);
  });

  it('limita la serie automática a 20 misiones', () => {
    expect(expandAutoMissions('CER', 50)).toHaveLength(AUTO_MISSION_COUNT_MAX);
    expect(() =>
      assertSubphaseDraft({
        subphaseBankId: 'sub-1',
        hours: 1,
        missionMode: 'automatic',
        missionTypeIds: [],
        customMissionNames: [],
        autoMissionCode: 'CER',
        autoMissionCount: 21,
        maneuverIds: [],
        sortOrder: 1,
      }),
    ).toThrow(InvalidAdminCatalogError);
  });
});

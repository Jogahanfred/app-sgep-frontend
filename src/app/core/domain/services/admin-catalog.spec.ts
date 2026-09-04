import { describe, expect, it } from 'vitest';
import { InvalidAdminCatalogError } from '../errors/domain-error';
import { AUTO_MISSION_COUNT_MAX } from '../entities/admin-catalog';
import {
  assertCatalogWrite,
  assertProgramStandardMatrixWrite,
  assertPhaseBankWrite,
  assertSubphaseDraft,
  catalogMissionKey,
  curriculumMissionRefs,
  customMissionKey,
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
    expect(programTypeLabel('HELI')).toMatch(/helicóptero/i);
    expect(
      assertProgramWrite({
        code: 'ppl-af',
        name: 'Piloto privado',
        programType: 'PPL',
        description: '',
        status: 'active',
        imageUrl: '/programs/custom.jpg',
      }).imageUrl,
    ).toBe('/programs/custom.jpg');
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

  it('conserva diagonales en los códigos académicos del programa de helicóptero', () => {
    const result = assertPhaseBankWrite({
      code: 'o/o',
      name: 'Orden de operaciones',
      description: '',
      status: 'active',
    });
    expect(result.code).toBe('O/O');
  });

  it('genera la serie automática C1 a C17 desde CER y 17', () => {
    const items = expandAutoMissions('CER', 17);
    expect(items[0]).toBe('C1');
    expect(items[1]).toBe('C2');
    expect(items[16]).toBe('C17');
    expect(items).toHaveLength(17);
  });

  it('crea claves estables para misiones de catálogo y propias', () => {
    const missions = curriculumMissionRefs({
      missionMode: 'manual',
      missionTypeIds: ['mt-local'],
      customMissionNames: ['Circuito corto'],
      autoMissionCode: '',
      autoMissionCount: 0,
    });
    expect(missions.map((mission) => mission.key)).toEqual([
      catalogMissionKey('mt-local'),
      customMissionKey('Circuito corto'),
    ]);
  });

  it('normaliza y combina estándares y nivel DIRBE de una misma celda', () => {
    const result = assertProgramStandardMatrixWrite({
      subphases: [
        {
          subphaseId: 'sp-1',
          assignments: [
            {
              missionKey: 'catalog:mt-local',
              maneuverId: 'man-toff',
              standardIds: ['std-1'],
              dirbeLevel: 'D',
            },
          ],
        },
        {
          subphaseId: 'sp-1',
          assignments: [
            {
              missionKey: 'catalog:mt-local',
              maneuverId: 'man-toff',
              standardIds: ['std-1', 'std-2'],
              dirbeLevel: 'R',
            },
          ],
        },
      ],
    });
    expect(result).toEqual({
      subphases: [
        {
          subphaseId: 'sp-1',
          assignments: [
            {
              missionKey: 'catalog:mt-local',
              maneuverId: 'man-toff',
              standardIds: ['std-1', 'std-2'],
              dirbeLevel: 'R',
            },
          ],
        },
      ],
    });
  });

  it('conserva una celda que solo tiene nivel DIRBE', () => {
    const result = assertProgramStandardMatrixWrite({
      subphases: [
        {
          subphaseId: 'sp-1',
          assignments: [
            {
              missionKey: 'custom:circuito-corto',
              maneuverId: 'man-land',
              standardIds: [],
              dirbeLevel: 'B',
            },
          ],
        },
      ],
    });

    expect(result.subphases[0].assignments).toEqual([
      {
        missionKey: 'custom:circuito-corto',
        maneuverId: 'man-land',
        standardIds: [],
        dirbeLevel: 'B',
      },
    ]);
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

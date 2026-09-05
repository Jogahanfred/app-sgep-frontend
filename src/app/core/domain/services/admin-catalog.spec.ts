import { describe, expect, it } from 'vitest';
import { InvalidAdminCatalogError } from '../errors/domain-error';
import { AUTO_MISSION_COUNT_MAX } from '../entities/admin-catalog';
import {
  assertCatalogWrite,
  assertProgramStandardMatrixWrite,
  assertPhaseBankWrite,
  assertSubphaseBankWrite,
  assertSubphaseDraft,
  catalogMissionKey,
  curriculumMissionRefs,
  customMissionKey,
  defaultProgramModuleKind,
  expandAutoMissions,
  assertProgramWrite,
  assertUserWrite,
  isProgramCulminated,
  matchesAdminSearch,
  normalizeProgramLifecycleFlag,
  passwordStrengthError,
  programTypeLabel,
  PROGRAM_CULMINATED_MESSAGE,
  assertProgramWritable,
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
    expect(result.lifecycleFlag).toBe('open');
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

  it('bloquea escritura cuando el flag de ciclo de vida es culminado', () => {
    expect(normalizeProgramLifecycleFlag('culminated')).toBe('culminated');
    expect(isProgramCulminated({ lifecycleFlag: 'open' })).toBe(false);
    expect(isProgramCulminated({ lifecycleFlag: 'culminated' })).toBe(true);
    expect(() => assertProgramWritable({ lifecycleFlag: 'culminated' })).toThrow(InvalidAdminCatalogError);
    expect(() => assertProgramWritable({ lifecycleFlag: 'culminated' })).toThrow(PROGRAM_CULMINATED_MESSAGE);
    expect(
      assertProgramWrite({
        code: 'pdi-heli-2023',
        name: 'Curso',
        programType: 'HELI',
        description: '',
        status: 'active',
        lifecycleFlag: 'culminated',
        academicYear: 2025,
      }).lifecycleFlag,
    ).toBe('culminated');
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

  it('conserva el ajuste de puntos DIRBE y la regla de peligroso', () => {
    const result = assertProgramStandardMatrixWrite({
      subphases: [
        {
          subphaseId: 'sp-1',
          assignments: [
            {
              missionKey: 'catalog:mt-local',
              maneuverId: 'man-toff',
              standardIds: ['std-1'],
              dirbeLevel: 'R',
              dirbePointDeltas: { D: -2, I: -1, R: 0, B: 1, E: 3 },
              dangerousOutcome: 'fail-mission',
              requiredToAdvance: true,
              requiredToGrade: true,
            },
          ],
        },
      ],
    });
    expect(result.subphases[0].assignments[0]).toEqual({
      missionKey: 'catalog:mt-local',
      maneuverId: 'man-toff',
      standardIds: ['std-1'],
      dirbeLevel: 'R',
      dirbePointDeltas: { D: -2, I: -1, B: 1, E: 3 },
      dirbePointAdds: { B: 1, E: 3 },
      dirbePointSubs: { D: 2, I: 1 },
      dangerousOutcome: 'fail-mission',
      requiredToAdvance: true,
      requiredToGrade: true,
    });
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

  it('conserva coeficiente NCT y nota mínima en el banco de subfase', () => {
    expect(
      assertSubphaseBankWrite({
        code: 'aero',
        name: 'Aerodinámica',
        description: '',
        status: 'active',
        coefficient: 0.13,
        minPassingGrade: 16,
      }),
    ).toMatchObject({ coefficient: 0.13, minPassingGrade: 16 });
    expect(() =>
      assertSubphaseBankWrite({
        code: 'aero',
        name: 'Aerodinámica',
        description: '',
        status: 'active',
        coefficient: 1.2,
      }),
    ).toThrow(InvalidAdminCatalogError);
  });

  it('clasifica cursos de tierra por el banco de fase', () => {
    expect(defaultProgramModuleKind('pb-heli-ctph-p1')).toBe('ground');
    expect(defaultProgramModuleKind('pb-heli-ccam')).toBe('ground');
    expect(defaultProgramModuleKind('pb-heli-sim')).toBe('simulator');
    expect(defaultProgramModuleKind('pb-sim')).toBe('simulator');
  });
});

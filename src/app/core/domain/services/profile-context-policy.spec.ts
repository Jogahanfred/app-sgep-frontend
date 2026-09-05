import { describe, expect, it } from 'vitest';
import { ALL_SQUADRONS_CONTEXT_VALUE } from '../entities/operational-context';
import type { OperationalIdentity } from '../entities/operational-context';
import type { RoleCode } from '../entities/role-code';
import { InvalidProfileContextError } from '../errors/domain-error';
import {
  getProfileRequirements,
  resolveRoleCode,
  squadronsForUnit,
  validateProfileSelection,
} from './profile-context-policy';

const units = [
  { id: 'unit-norte', code: 'U-NORTE', name: 'Base Norte', abbreviation: 'BN', status: 'active' as const },
  { id: 'unit-sur', code: 'U-SUR', name: 'Base Sur', abbreviation: 'BS', status: 'active' as const },
];

const squadrons = [
  { id: 'sq-alfa', unitId: 'unit-norte', code: 'ESC-A', name: 'Alfa', description: '', status: 'active' as const },
  { id: 'sq-bravo', unitId: 'unit-norte', code: 'ESC-B', name: 'Bravo', description: '', status: 'active' as const },
  { id: 'sq-delta', unitId: 'unit-sur', code: 'ESC-D', name: 'Delta', description: '', status: 'active' as const },
];

function identity(role: RoleCode, assignedUnitId: string | null, assignedSquadronId: string | null): OperationalIdentity {
  return {
    userId: 'usr-1',
    displayName: 'Prueba',
    roleCode: role,
    assignedUnitId,
    assignedSquadronId,
  };
}

describe('profile-context-policy', () => {
  it('define la matriz de perfilamiento por rol', () => {
    expect(getProfileRequirements('ADSYS').allowUnitChange).toBe(true);
    expect(getProfileRequirements('ADPER').allowUnitChange).toBe(false);
    expect(getProfileRequirements('ADPER').allowSquadronChange).toBe(true);
    expect(getProfileRequirements('COMDO').allowSquadronChange).toBe(true);
    expect(getProfileRequirements('JOPER').allowAllSquadrons).toBe(true);
    expect(getProfileRequirements('JESQD').allowSquadronChange).toBe(false);
    expect(getProfileRequirements('JINST').squadronRequired).toBe(true);
    expect(getProfileRequirements('INSTR').unitMode).toBe('locked');
    expect(getProfileRequirements('EVALU').squadronMode).toBe('locked');
    expect(getProfileRequirements('PILOT').allowUnitChange).toBe(false);
    expect(getProfileRequirements('AUDIT').contextKind).toBe('audit');
  });

  it('filtra escuadrones por unidad', () => {
    expect(squadronsForUnit(squadrons, 'unit-norte').map((item) => item.id)).toEqual(['sq-alfa', 'sq-bravo']);
    expect(squadronsForUnit(squadrons, 'unit-sur').map((item) => item.id)).toEqual(['sq-delta']);
    expect(squadronsForUnit(squadrons, null)).toEqual([]);
  });

  it('permite a ADSYS elegir unidad y todos los escuadrones', () => {
    const context = validateProfileSelection(
      identity('ADSYS', null, null),
      { unitId: 'unit-norte', squadronId: ALL_SQUADRONS_CONTEXT_VALUE },
      units,
      squadrons,
    );
    expect(context.unitId).toBe('unit-norte');
    expect(context.squadronId).toBeNull();
    expect(context.coversAllSquadrons).toBe(true);
  });

  it('impide un escuadrón de otra unidad', () => {
    expect(() =>
      validateProfileSelection(
        identity('ADSYS', null, null),
        { unitId: 'unit-norte', squadronId: 'sq-delta' },
        units,
        squadrons,
      ),
    ).toThrow(InvalidProfileContextError);
  });

  it('ignora un cambio de unidad no permitido', () => {
    const context = validateProfileSelection(
      identity('ADPER', 'unit-sur', null),
      { unitId: 'unit-norte', squadronId: 'sq-delta' },
      units,
      squadrons,
    );
    expect(context.unitId).toBe('unit-sur');
    expect(context.squadronId).toBe('sq-delta');
  });

  it('fija unidad y escuadrón para roles asignados', () => {
    const context = validateProfileSelection(
      identity('PILOT', 'unit-norte', 'sq-alfa'),
      { unitId: 'unit-sur', squadronId: 'sq-delta' },
      units,
      squadrons,
    );
    expect(context.unitId).toBe('unit-norte');
    expect(context.squadronId).toBe('sq-alfa');
    expect(context.coversAllSquadrons).toBe(false);
  });

  it('resuelve AUDIT sin unidad ni escuadrón', () => {
    const context = validateProfileSelection(identity('AUDIT', null, null), { unitId: 'unit-norte', squadronId: 'sq-alfa' }, units, squadrons);
    expect(context.unitId).toBeNull();
    expect(context.squadronId).toBeNull();
    expect(context.coversAllSquadrons).toBe(true);
  });

  it('resuelve el rol de mayor alcance', () => {
    expect(
      resolveRoleCode([
        { id: 'r1', name: 'Piloto', description: '', status: 'active', code: 'PILOT' },
        { id: 'r2', name: 'Admin', description: '', status: 'active', code: 'ADSYS' },
      ]),
    ).toBe('ADSYS');
  });
});

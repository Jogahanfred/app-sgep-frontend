import type { OperationalIdentity, OperationalContext, ProfileContextSelection } from '../entities/operational-context';
import { ALL_SQUADRONS_CONTEXT_VALUE } from '../entities/operational-context';
import type { RoleCode } from '../entities/role-code';
import { ROLE_CODES, ROLE_PROFILES, isRoleCode } from '../entities/role-code';
import type { SquadronEntity, UnitEntity, UserRoleEntity } from '../entities/admin-catalog';
import { InvalidProfileContextError } from '../errors/domain-error';

export type ContextFieldMode = 'hidden' | 'locked' | 'selectable';

export interface ProfileRequirements {
  unitMode: ContextFieldMode;
  squadronMode: ContextFieldMode;
  unitRequired: boolean;
  squadronRequired: boolean;
  allowAllSquadrons: boolean;
  allowUnitChange: boolean;
  allowSquadronChange: boolean;
  contextKind: 'operational' | 'audit';
}

const SELECTABLE_OR_ALL: ProfileRequirements = {
  unitMode: 'locked',
  squadronMode: 'selectable',
  unitRequired: true,
  squadronRequired: false,
  allowAllSquadrons: true,
  allowUnitChange: false,
  allowSquadronChange: true,
  contextKind: 'operational',
};

const ASSIGNED_BOTH: ProfileRequirements = {
  unitMode: 'locked',
  squadronMode: 'locked',
  unitRequired: true,
  squadronRequired: true,
  allowAllSquadrons: false,
  allowUnitChange: false,
  allowSquadronChange: false,
  contextKind: 'operational',
};

const REQUIREMENTS_BY_ROLE: Record<RoleCode, ProfileRequirements> = {
  ADSYS: {
    unitMode: 'selectable',
    squadronMode: 'selectable',
    unitRequired: true,
    squadronRequired: false,
    allowAllSquadrons: true,
    allowUnitChange: true,
    allowSquadronChange: true,
    contextKind: 'operational',
  },
  ADPER: SELECTABLE_OR_ALL,
  COMDO: SELECTABLE_OR_ALL,
  JOPER: SELECTABLE_OR_ALL,
  JESQD: ASSIGNED_BOTH,
  JINST: ASSIGNED_BOTH,
  INSTR: ASSIGNED_BOTH,
  EVALU: ASSIGNED_BOTH,
  PILOT: ASSIGNED_BOTH,
  AUDIT: {
    unitMode: 'hidden',
    squadronMode: 'hidden',
    unitRequired: false,
    squadronRequired: false,
    allowAllSquadrons: true,
    allowUnitChange: false,
    allowSquadronChange: false,
    contextKind: 'audit',
  },
};

export function getProfileRequirements(role: RoleCode): ProfileRequirements {
  return REQUIREMENTS_BY_ROLE[role];
}

export function operationalContextNeedsSquadronPick(context: OperationalContext): boolean {
  const requirements = getProfileRequirements(context.roleCode);
  if (!requirements.allowSquadronChange) return false;
  if (!context.unitId) return false;
  if (context.coversAllSquadrons) return false;
  return !context.squadronId;
}

export function roleDisplayName(role: RoleCode): string {
  return ROLE_PROFILES[role].name;
}

export function resolveRoleCode(roles: readonly UserRoleEntity[]): RoleCode {
  const codes = roles
    .map((role) => role.code)
    .filter((code): code is RoleCode => !!code && isRoleCode(code));
  const ranked = ROLE_CODES.find((code) => codes.includes(code));
  if (!ranked) {
    throw new InvalidProfileContextError('El usuario no tiene un rol operacional asignado.');
  }
  return ranked;
}

export function squadronsForUnit(
  squadrons: readonly SquadronEntity[],
  unitId: string | null,
): SquadronEntity[] {
  if (!unitId) return [];
  return squadrons.filter((squadron) => squadron.unitId === unitId);
}

export function isAllSquadronsSelection(squadronId: string | null): boolean {
  return squadronId === ALL_SQUADRONS_CONTEXT_VALUE;
}

export function validateProfileSelection(
  identity: OperationalIdentity,
  selection: ProfileContextSelection,
  units: readonly UnitEntity[],
  squadrons: readonly SquadronEntity[],
): OperationalContext {
  const requirements = getProfileRequirements(identity.roleCode);

  if (requirements.contextKind === 'audit') {
    return {
      ...identity,
      unitId: null,
      squadronId: null,
      coversAllSquadrons: true,
    };
  }

  const unitId = resolveUnitId(identity, selection, requirements);
  if (requirements.unitRequired && !unitId) {
    throw new InvalidProfileContextError('Selecciona una unidad para continuar.');
  }

  const unit = units.find((item) => item.id === unitId);
  if (unitId && !unit) {
    throw new InvalidProfileContextError('La unidad seleccionada no está disponible.');
  }

  const squadronId = resolveSquadronId(identity, selection, requirements, unitId);
  const coversAllSquadrons = !squadronId && requirements.allowAllSquadrons;

  if (requirements.squadronRequired && !squadronId) {
    throw new InvalidProfileContextError('El escuadrón asignado es obligatorio para este rol.');
  }

  if (squadronId) {
    const squadron = squadrons.find((item) => item.id === squadronId);
    if (!squadron) {
      throw new InvalidProfileContextError('El escuadrón seleccionado no está disponible.');
    }
    if (unitId && squadron.unitId !== unitId) {
      throw new InvalidProfileContextError('El escuadrón no pertenece a la unidad seleccionada.');
    }
  }

  return {
    ...identity,
    unitId,
    squadronId,
    coversAllSquadrons,
  };
}

function resolveUnitId(
  identity: OperationalIdentity,
  selection: ProfileContextSelection,
  requirements: ProfileRequirements,
): string | null {
  if (!requirements.allowUnitChange) {
    return identity.assignedUnitId;
  }
  return selection.unitId;
}

function resolveSquadronId(
  identity: OperationalIdentity,
  selection: ProfileContextSelection,
  requirements: ProfileRequirements,
  unitId: string | null,
): string | null {
  if (!requirements.allowSquadronChange) {
    return identity.assignedSquadronId;
  }
  if (isAllSquadronsSelection(selection.squadronId) || selection.squadronId === null) {
    if (!requirements.allowAllSquadrons && requirements.squadronRequired) {
      return identity.assignedSquadronId;
    }
    return null;
  }
  if (unitId && identity.assignedSquadronId && !requirements.allowSquadronChange) {
    return identity.assignedSquadronId;
  }
  return selection.squadronId;
}

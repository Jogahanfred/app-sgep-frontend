import type { RoleCode } from './role-code';

export const ALL_SQUADRONS_CONTEXT_VALUE = '*';

export interface OperationalIdentity {
  userId: string;
  displayName: string;
  roleCode: RoleCode;
  assignedUnitId: string | null;
  assignedSquadronId: string | null;
}

export interface OperationalContext extends OperationalIdentity {
  unitId: string | null;
  squadronId: string | null;
  coversAllSquadrons: boolean;
}

export interface ProfileContextSelection {
  unitId: string | null;
  squadronId: string | null;
}

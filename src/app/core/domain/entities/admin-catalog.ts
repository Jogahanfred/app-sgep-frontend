export type EntityStatus = 'active' | 'inactive';

export const SESSION_DEMO_USER_ID = 'usr-elena-martin';

export interface UserRoleEntity {
  id: string;
  name: string;
  description: string;
  status: EntityStatus;
}

export interface SpecialtyEntity {
  id: string;
  name: string;
  description: string;
  status: EntityStatus;
}

export interface SpecialtyUserEntity {
  id: string;
  userId: string;
  specialtyId: string;
}

export interface UserEntity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string;
  entryDate: string;
  indicative: string | null;
  status: EntityStatus;
  roleIds: string[];
  specialtyIds: string[];
}

export interface UserWriteInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  documentNumber: string;
  entryDate: string;
  indicative: string;
  status: EntityStatus;
  roleIds: string[];
  specialtyIds: string[];
}

export interface CatalogWriteInput {
  name: string;
  description: string;
  status: EntityStatus;
}

export interface UnitEntity {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  status: EntityStatus;
}

export interface UnitWriteInput {
  code: string;
  name: string;
  abbreviation: string;
  status: EntityStatus;
}

export interface SquadronEntity {
  id: string;
  unitId: string;
  code: string;
  name: string;
  description: string;
  status: EntityStatus;
}

export interface SquadronWriteInput {
  unitId: string;
  code: string;
  name: string;
  description: string;
  status: EntityStatus;
}

export type CommissionWorkflowStatus = 'registered' | 'approved' | 'active' | 'finished';

export const COMMISSION_WORKFLOW: CommissionWorkflowStatus[] = [
  'registered',
  'approved',
  'active',
  'finished',
];

export interface TemporaryCommissionEntity {
  id: string;
  userId: string;
  originUnitId: string;
  destinationUnitId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: CommissionWorkflowStatus;
}

export interface TemporaryCommissionWriteInput {
  userId: string;
  originUnitId: string;
  destinationUnitId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: CommissionWorkflowStatus;
}

export interface OperationEntity {
  id: string;
  name: string;
  description: string;
  status: EntityStatus;
}

export interface MissionTypeEntity {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface MissionTypeWriteInput {
  code: string;
  name: string;
  description: string;
}

export interface ManeuverBankEntity {
  id: string;
  operationId: string;
  code: string;
  name: string;
  description: string;
}

export interface ManeuverBankWriteInput {
  operationId: string;
  code: string;
  name: string;
  description: string;
}

export interface StandardEntity {
  id: string;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
}

export interface StandardWriteInput {
  code: string;
  name: string;
  description: string;
  sortOrder: number;
}

export const INSTRUCTION_PROGRAMS = ['PPL', 'CPL', 'ATPL', 'IR'] as const;
export type InstructionProgram = (typeof INSTRUCTION_PROGRAMS)[number];

export interface StandardWeightingEntity {
  id: string;
  standardId: string;
  unitId: string;
  squadronId: string;
  program: InstructionProgram;
  weightedValue: number;
  validFrom: string;
  validTo: string;
}

export interface StandardWeightingWriteInput {
  standardId: string;
  unitId: string;
  squadronId: string;
  program: InstructionProgram;
  weightedValue: number;
  validFrom: string;
  validTo: string;
}

export const FLEET_TYPES = ['fixed-wing', 'rotary', 'uas'] as const;
export type FleetType = (typeof FLEET_TYPES)[number];

export interface FleetEntity {
  id: string;
  fleetType: FleetType;
  code: string;
  name: string;
  description: string;
  status: EntityStatus;
}

export interface FleetWriteInput {
  fleetType: FleetType;
  code: string;
  name: string;
  description: string;
  status: EntityStatus;
}

export interface AircraftEntity {
  id: string;
  unitId: string;
  fleetId: string;
  registration: string;
  operational: boolean;
  status: EntityStatus;
  imageUrl: string;
}

export interface AircraftWriteInput {
  unitId: string;
  fleetId: string;
  registration: string;
  operational: boolean;
  status: EntityStatus;
  imageUrl: string;
}

export const PROGRAM_TYPES = ['PPL', 'CPL', 'ATPL', 'IR', 'FI'] as const;
export type ProgramType = (typeof PROGRAM_TYPES)[number];

export interface PhaseBankEntity {
  id: string;
  code: string;
  name: string;
  description: string;
  status: EntityStatus;
}

export interface SubphaseBankEntity {
  id: string;
  code: string;
  name: string;
  description: string;
  status: EntityStatus;
}

export interface ProgramEntity {
  id: string;
  code: string;
  name: string;
  programType: ProgramType;
  description: string;
  status: EntityStatus;
  imageUrl: string;
}

export interface ProgramWriteInput {
  code: string;
  name: string;
  programType: ProgramType;
  description: string;
  status: EntityStatus;
  imageUrl?: string;
}

export interface PhaseEntity {
  id: string;
  programId: string;
  phaseBankId: string;
  sortOrder: number;
}

export const MISSION_ASSIGN_MODES = ['manual', 'automatic'] as const;
export type MissionAssignMode = (typeof MISSION_ASSIGN_MODES)[number];

export interface SubphaseEntity {
  id: string;
  phaseId: string;
  subphaseBankId: string;
  hours: number;
  missionMode: MissionAssignMode;
  missionTypeIds: string[];
  customMissionNames: string[];
  autoMissionCode: string;
  autoMissionCount: number;
  maneuverIds: string[];
  sortOrder: number;
}

export interface SubphaseDraftInput {
  subphaseBankId: string;
  hours: number;
  missionMode: MissionAssignMode;
  missionTypeIds: string[];
  customMissionNames: string[];
  autoMissionCode: string;
  autoMissionCount: number;
  maneuverIds: string[];
  sortOrder: number;
}

export interface PhaseDraftInput {
  phaseBankId: string;
  sortOrder: number;
  subphases: SubphaseDraftInput[];
}

export interface ProgramCurriculumWriteInput {
  id?: string;
  program: ProgramWriteInput;
  phases: PhaseDraftInput[];
}

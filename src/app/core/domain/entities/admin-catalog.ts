import type { RoleCode } from './role-code';

export type EntityStatus = 'active' | 'inactive';
export type { RoleCode } from './role-code';

export const SESSION_DEMO_USER_ID = 'usr-elena-martin';

export interface UserRoleEntity {
  id: string;
  name: string;
  description: string;
  status: EntityStatus;
  code?: RoleCode;
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
  assignedUnitId: string | null;
  assignedSquadronId: string | null;
  photoUrl?: string | null;
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
  assignedUnitId?: string | null;
  assignedSquadronId?: string | null;
}

export interface PromotionEntity {
  id: string;
  code: string;
  name: string;
  year: number;
  unitId: string;
  squadronId: string;
  startDate: string;
  endDate: string;
}

export interface PromotionWriteInput {
  code: string;
  name: string;
  year: number;
  unitId: string;
  squadronId: string;
  startDate: string;
  endDate: string;
}

export interface PromotionMemberEntity {
  id: string;
  promotionId: string;
  userId: string;
  entryDate: string;
}

export const PROGRAM_ENROLLMENT_SOURCES = ['promotion', 'individual'] as const;
export type ProgramEnrollmentSource = (typeof PROGRAM_ENROLLMENT_SOURCES)[number];

export const PROGRAM_ENROLLMENT_STATUSES = ['active', 'suspended', 'withdrawn', 'dropped', 'completed'] as const;
export type ProgramEnrollmentStatus = (typeof PROGRAM_ENROLLMENT_STATUSES)[number];
export const PROGRAM_ENROLLMENT_CLOSE_STATUSES = ['suspended', 'withdrawn', 'dropped'] as const;
export type ProgramEnrollmentCloseStatus = (typeof PROGRAM_ENROLLMENT_CLOSE_STATUSES)[number];

export interface ProgramEnrollmentEntity {
  id: string;
  programId: string;
  userId: string;
  promotionId: string | null;
  source: ProgramEnrollmentSource;
  enrolledAt: string;
  status: ProgramEnrollmentStatus;
  closedAt: string | null;
  closeReason: string | null;
  groundCourseIds?: string[];
  groundEvaluations?: GroundEvaluationRecord[];
  simulatorEvaluations?: GroundEvaluationRecord[];
}

export interface GroundEvaluationRecord {
  courseId: string;
  code: string;
  status: 'completed' | 'available' | 'blocked';
  grade: number | null;
}

export interface ProgramEnrollmentWriteInput {
  programId: string;
  source: ProgramEnrollmentSource;
  promotionId: string | null;
  userId: string | null;
  userIds?: string[] | null;
  enrolledAt: string;
}

export interface ProgramEnrollmentCloseInput {
  status: ProgramEnrollmentCloseStatus;
  closedAt: string;
  closeReason: string;
}

export type TrainingAssignmentStatus = 'scheduled' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
export const TRAINING_ASSIGNMENT_WORKFLOW: TrainingAssignmentStatus[] = ['scheduled', 'assigned', 'in-progress', 'completed'];

export interface GroupMissionAssignmentEntity {
  id: string;
  promotionId: string;
  programId: string;
  scheduledDate: string;
  trainingLeadId: string;
  status: TrainingAssignmentStatus;
  participantIds: string[];
  cancellationReason?: string;
}

export interface GroupMissionAssignmentWriteInput {
  promotionId: string;
  programId: string;
  scheduledDate: string;
  trainingLeadId: string;
  status: TrainingAssignmentStatus;
  participantIds: string[];
  cancellationReason?: string;
}

export type IndividualAssignmentCase = 'pdi' | 'pde' | 'commission';

export interface IndividualMissionAssignmentEntity {
  id: string;
  assignmentCase: IndividualAssignmentCase;
  studentId: string | null;
  externalPerson: string | null;
  programId: string | null;
  missionId: string;
  instructorId: string | null;
  date: string;
  status: TrainingAssignmentStatus;
  cancellationReason?: string;
}

export interface IndividualMissionAssignmentWriteInput {
  assignmentCase: IndividualAssignmentCase;
  studentId: string | null;
  externalPerson: string | null;
  programId: string | null;
  missionId: string;
  instructorId: string | null;
  date: string;
  status: TrainingAssignmentStatus;
  cancellationReason?: string;
}

export type MissionExecutionStatus = 'scheduled' | 'in-progress' | 'completed';
export type ManeuverGrade = 'D' | 'I' | 'R' | 'B' | 'E' | 'NC' | 'P';
export type MissionResult = 'approved' | 'approved-observations' | 'reinforcement' | 'failed';
export type MissionSignatureMethod = 'type' | 'draw' | 'image';

export interface MissionSignature {
  signerUserId: string;
  signerName: string;
  signedAt: string;
  method: MissionSignatureMethod;
  value: string;
}

export interface ManeuverEvaluationEntity {
  id: string;
  maneuverId: string;
  grade: ManeuverGrade | null;
  observation: string;
  evidenceName: string | null;
  cause?: string;
  recommendation?: string;
  corrected?: boolean;
}

export interface MissionExecutionEntity {
  id: string;
  individualAssignmentId: string;
  status: MissionExecutionStatus;
  startDate: string | null;
  startTime: string | null;
  takeoffTime: string;
  landingTime: string;
  executedHours: number;
  aircraftId: string | null;
  observations: string;
  strengths: string;
  improvements: string;
  recommendations: string;
  evaluations: ManeuverEvaluationEntity[];
  result: MissionResult | null;
  instructorSignature?: MissionSignature | null;
  studentSignature?: MissionSignature | null;
  counselRequested?: boolean;
}

export interface MissionExecutionWriteInput {
  status: MissionExecutionStatus;
  startDate: string | null;
  startTime: string | null;
  takeoffTime: string;
  landingTime: string;
  executedHours: number;
  aircraftId: string | null;
  observations: string;
  strengths: string;
  improvements: string;
  recommendations: string;
  evaluations: ManeuverEvaluationEntity[];
  result: MissionResult | null;
  instructorSignature?: MissionSignature | null;
  studentSignature?: MissionSignature | null;
  counselRequested?: boolean;
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
  imageUrl?: string;
}

export interface UnitWriteInput {
  code: string;
  name: string;
  abbreviation: string;
  status: EntityStatus;
  imageUrl?: string;
}

export interface SquadronEntity {
  id: string;
  unitId: string;
  code: string;
  name: string;
  description: string;
  status: EntityStatus;
  imageUrl?: string;
}

export interface SquadronWriteInput {
  unitId: string;
  code: string;
  name: string;
  description: string;
  status: EntityStatus;
  imageUrl?: string;
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

export const PROGRAM_TYPES = ['PPL', 'CPL', 'ATPL', 'IR', 'FI', 'HELI'] as const;
export type ProgramType = (typeof PROGRAM_TYPES)[number];
export const PROGRAM_LIFECYCLE_FLAGS = ['open', 'culminated'] as const;
export type ProgramLifecycleFlag = (typeof PROGRAM_LIFECYCLE_FLAGS)[number];
export const PROGRAM_LIFECYCLE_FLAG = {
  open: 'open',
  culminated: 'culminated',
} as const satisfies Record<string, ProgramLifecycleFlag>;

export const PROGRAM_MODULE_KINDS = ['ground', 'air', 'simulator'] as const;
export type ProgramModuleKind = (typeof PROGRAM_MODULE_KINDS)[number];

export const GROUND_PERIODIC_EXAM_KINDS = ['weekly', 'biweekly', 'monthly', 'semester', 'unannounced'] as const;
export type GroundPeriodicExamKind = (typeof GROUND_PERIODIC_EXAM_KINDS)[number];

export interface GroundPeriodicExamRule {
  id: string;
  period: string;
  exam: string;
  kind: GroundPeriodicExamKind;
  minPassingGrade: number;
  countsTowardNei: boolean;
  neiWeight: number;
}

export interface PhaseBankEntity {
  id: string;
  code: string;
  name: string;
  description: string;
  status: EntityStatus;
}

export interface PhaseBankWriteInput {
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
  coefficient?: number;
  minPassingGrade?: number;
}

export interface SubphaseBankWriteInput {
  code: string;
  name: string;
  description: string;
  status: EntityStatus;
  coefficient?: number;
  minPassingGrade?: number;
}

export interface ProgramEntity {
  id: string;
  code: string;
  name: string;
  programType: ProgramType;
  description: string;
  status: EntityStatus;
  imageUrl: string;
  standardIds: string[];
  academicYear?: number;
  lifecycleFlag: ProgramLifecycleFlag;
  groundPeriodicExams?: GroundPeriodicExamRule[];
}

export interface ProgramWriteInput {
  code: string;
  name: string;
  programType: ProgramType;
  description: string;
  status: EntityStatus;
  imageUrl?: string;
  standardIds?: string[];
  academicYear?: number;
  lifecycleFlag?: ProgramLifecycleFlag;
  groundPeriodicExams?: GroundPeriodicExamRule[];
}

export interface PhaseEntity {
  id: string;
  programId: string;
  phaseBankId: string;
  moduleKind: ProgramModuleKind;
  sortOrder: number;
}

export const MISSION_ASSIGN_MODES = ['manual', 'automatic'] as const;
export type MissionAssignMode = (typeof MISSION_ASSIGN_MODES)[number];
export const AUTO_MISSION_COUNT_MAX = 20;

export const DIRBE_LEVELS = ['D', 'I', 'R', 'B', 'E'] as const;
export type DirbeLevel = (typeof DIRBE_LEVELS)[number];

export const DIRBE_DANGEROUS_OUTCOMES = ['deduct', 'fail-mission'] as const;
export type DirbeDangerousOutcome = (typeof DIRBE_DANGEROUS_OUTCOMES)[number];

export interface ManeuverStandardAssignment {
  missionKey: string;
  maneuverId: string;
  standardIds: string[];
  dirbeLevel?: DirbeLevel;
  dirbePointDeltas?: Partial<Record<DirbeLevel, number>>;
  dirbePointAdds?: Partial<Record<DirbeLevel, number>>;
  dirbePointSubs?: Partial<Record<DirbeLevel, number>>;
  dangerousOutcome?: DirbeDangerousOutcome;
  dangerousPoints?: number;
  dangerousAdd?: number;
  dangerousSub?: number;
  requiredToAdvance?: boolean;
  requiredToGrade?: boolean;
}

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
  maneuverOperationIds: string[];
  maneuverAssignment: Record<string, string>;
  standardAssignments: ManeuverStandardAssignment[];
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
  maneuverOperationIds?: string[];
  maneuverAssignment?: Record<string, string>;
  standardAssignments?: ManeuverStandardAssignment[];
  sortOrder: number;
}

export interface SubphaseStandardMatrixWriteInput {
  subphaseId: string;
  assignments: ManeuverStandardAssignment[];
}

export interface ProgramStandardMatrixWriteInput {
  subphases: SubphaseStandardMatrixWriteInput[];
}

export interface PhaseDraftInput {
  phaseBankId: string;
  moduleKind?: ProgramModuleKind;
  sortOrder: number;
  subphases: SubphaseDraftInput[];
}

export interface ProgramCurriculumWriteInput {
  id?: string;
  program: ProgramWriteInput;
  phases: PhaseDraftInput[];
}

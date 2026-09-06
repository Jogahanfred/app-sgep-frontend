import { Observable } from 'rxjs';
import type {
  AircraftEntity,
  AircraftWriteInput,
  CatalogWriteInput,
  FleetEntity,
  FleetWriteInput,
  ManeuverBankEntity,
  ManeuverBankWriteInput,
  MissionTypeEntity,
  MissionTypeWriteInput,
  OperationEntity,
  PhaseBankEntity,
  PhaseBankWriteInput,
  PhaseEntity,
  ProgramCurriculumWriteInput,
  ProgramStandardMatrixWriteInput,
  ProgramEntity,
  PromotionEntity,
  PromotionMemberEntity,
  PromotionWriteInput,
  ProgramEnrollmentCloseInput,
  ProgramEnrollmentEntity,
  ProgramEnrollmentWriteInput,
  GroundEvaluationRecord,
  GroupMissionAssignmentEntity,
  GroupMissionAssignmentWriteInput,
  IndividualMissionAssignmentEntity,
  IndividualMissionAssignmentWriteInput,
  MissionExecutionEntity,
  MissionExecutionWriteInput,
  SubphaseBankEntity,
  SubphaseBankWriteInput,
  SubphaseEntity,
  SquadronEntity,
  SquadronWriteInput,
  SpecialtyEntity,
  SpecialtyUserEntity,
  StandardEntity,
  StandardWeightingEntity,
  StandardWeightingWriteInput,
  StandardWriteInput,
  TemporaryCommissionEntity,
  TemporaryCommissionWriteInput,
  UnitEntity,
  UnitWriteInput,
  UserEntity,
  UserRoleEntity,
  UserWriteInput,
} from '../domain/entities/admin-catalog';

export interface AdminCatalogRepository {
  listUsers(): Observable<UserEntity[]>;
  getUser(id: string): Observable<UserEntity>;
  createUser(input: UserWriteInput): Observable<UserEntity>;
  updateUser(id: string, input: UserWriteInput): Observable<UserEntity>;

  listPromotions(): Observable<PromotionEntity[]>;
  getPromotion(id: string): Observable<PromotionEntity>;
  createPromotion(input: PromotionWriteInput): Observable<PromotionEntity>;
  updatePromotion(id: string, input: PromotionWriteInput): Observable<PromotionEntity>;
  listPromotionMembers(promotionId: string): Observable<PromotionMemberEntity[]>;
  savePromotionMembers(promotionId: string, userIds: string[], entryDate: string): Observable<PromotionMemberEntity[]>;

  listProgramEnrollments(): Observable<ProgramEnrollmentEntity[]>;
  enrollInProgram(input: ProgramEnrollmentWriteInput): Observable<ProgramEnrollmentEntity[]>;
  closeProgramEnrollment(id: string, input: ProgramEnrollmentCloseInput): Observable<ProgramEnrollmentEntity>;
  saveEnrollmentGroundCourses(id: string, groundCourseIds: readonly string[]): Observable<ProgramEnrollmentEntity>;
  saveEnrollmentGroundEvaluations(
    id: string,
    groundEvaluations: readonly GroundEvaluationRecord[],
  ): Observable<ProgramEnrollmentEntity>;
  saveEnrollmentSimulatorEvaluations(
    id: string,
    simulatorEvaluations: readonly GroundEvaluationRecord[],
  ): Observable<ProgramEnrollmentEntity>;

  listGroupAssignments(): Observable<GroupMissionAssignmentEntity[]>;
  createGroupAssignment(input: GroupMissionAssignmentWriteInput): Observable<GroupMissionAssignmentEntity>;
  updateGroupAssignment(id: string, input: GroupMissionAssignmentWriteInput): Observable<GroupMissionAssignmentEntity>;
  listIndividualAssignments(): Observable<IndividualMissionAssignmentEntity[]>;
  createIndividualAssignment(input: IndividualMissionAssignmentWriteInput): Observable<IndividualMissionAssignmentEntity>;
  updateIndividualAssignment(id: string, input: IndividualMissionAssignmentWriteInput): Observable<IndividualMissionAssignmentEntity>;
  listMissionExecutions(): Observable<MissionExecutionEntity[]>;
  getMissionExecution(id: string): Observable<MissionExecutionEntity>;
  createMissionExecution(
    individualAssignmentId: string,
    input: MissionExecutionWriteInput,
  ): Observable<MissionExecutionEntity>;
  updateMissionExecution(id: string, input: MissionExecutionWriteInput): Observable<MissionExecutionEntity>;

  listRoles(): Observable<UserRoleEntity[]>;
  createRole(input: CatalogWriteInput): Observable<UserRoleEntity>;
  updateRole(id: string, input: CatalogWriteInput): Observable<UserRoleEntity>;

  listSpecialties(): Observable<SpecialtyEntity[]>;
  listSpecialtyUsers(): Observable<SpecialtyUserEntity[]>;
  createSpecialty(input: CatalogWriteInput): Observable<SpecialtyEntity>;
  updateSpecialty(id: string, input: CatalogWriteInput): Observable<SpecialtyEntity>;

  listUnits(): Observable<UnitEntity[]>;
  createUnit(input: UnitWriteInput): Observable<UnitEntity>;
  updateUnit(id: string, input: UnitWriteInput): Observable<UnitEntity>;

  listSquadrons(): Observable<SquadronEntity[]>;
  createSquadron(input: SquadronWriteInput): Observable<SquadronEntity>;
  updateSquadron(id: string, input: SquadronWriteInput): Observable<SquadronEntity>;

  listTemporaryCommissions(): Observable<TemporaryCommissionEntity[]>;
  createTemporaryCommission(input: TemporaryCommissionWriteInput): Observable<TemporaryCommissionEntity>;
  updateTemporaryCommission(id: string, input: TemporaryCommissionWriteInput): Observable<TemporaryCommissionEntity>;

  listOperations(): Observable<OperationEntity[]>;
  createOperation(input: CatalogWriteInput): Observable<OperationEntity>;
  updateOperation(id: string, input: CatalogWriteInput): Observable<OperationEntity>;

  listMissionTypes(): Observable<MissionTypeEntity[]>;
  createMissionType(input: MissionTypeWriteInput): Observable<MissionTypeEntity>;
  updateMissionType(id: string, input: MissionTypeWriteInput): Observable<MissionTypeEntity>;

  listManeuvers(): Observable<ManeuverBankEntity[]>;
  createManeuver(input: ManeuverBankWriteInput): Observable<ManeuverBankEntity>;
  updateManeuver(id: string, input: ManeuverBankWriteInput): Observable<ManeuverBankEntity>;

  listStandards(): Observable<StandardEntity[]>;
  createStandard(input: StandardWriteInput): Observable<StandardEntity>;
  updateStandard(id: string, input: StandardWriteInput): Observable<StandardEntity>;

  listWeightings(): Observable<StandardWeightingEntity[]>;
  createWeighting(input: StandardWeightingWriteInput): Observable<StandardWeightingEntity>;
  updateWeighting(id: string, input: StandardWeightingWriteInput): Observable<StandardWeightingEntity>;

  listFleets(): Observable<FleetEntity[]>;
  createFleet(input: FleetWriteInput): Observable<FleetEntity>;
  updateFleet(id: string, input: FleetWriteInput): Observable<FleetEntity>;

  listAircraft(): Observable<AircraftEntity[]>;
  createAircraft(input: AircraftWriteInput): Observable<AircraftEntity>;
  updateAircraft(id: string, input: AircraftWriteInput): Observable<AircraftEntity>;

  listPrograms(): Observable<ProgramEntity[]>;
  listPhases(): Observable<PhaseEntity[]>;
  listSubphases(): Observable<SubphaseEntity[]>;
  listPhaseBanks(): Observable<PhaseBankEntity[]>;
  createPhaseBank(input: PhaseBankWriteInput): Observable<PhaseBankEntity>;
  updatePhaseBank(id: string, input: PhaseBankWriteInput): Observable<PhaseBankEntity>;
  listSubphaseBanks(): Observable<SubphaseBankEntity[]>;
  createSubphaseBank(input: SubphaseBankWriteInput): Observable<SubphaseBankEntity>;
  updateSubphaseBank(id: string, input: SubphaseBankWriteInput): Observable<SubphaseBankEntity>;
  saveProgramCurriculum(input: ProgramCurriculumWriteInput): Observable<ProgramEntity>;
  assignProgramStandards(id: string, standardIds: string[]): Observable<ProgramEntity>;
  saveProgramStandardMatrix(id: string, input: ProgramStandardMatrixWriteInput): Observable<ProgramEntity>;
}

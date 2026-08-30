import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
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
  ProgramEntity,
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
} from '../../domain/entities/admin-catalog';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import {
  buildSpecialtyUsers,
  SEED_AIRCRAFT,
  SEED_COMMISSIONS,
  SEED_FLEETS,
  SEED_MANEUVERS,
  SEED_MISSION_TYPES,
  SEED_OPERATIONS,
  SEED_PHASES,
  SEED_PHASE_BANKS,
  SEED_PROGRAMS,
  SEED_SUBPHASES,
  SEED_SUBPHASE_BANKS,
  SEED_PASSWORDS,
  SEED_ROLES,
  SEED_SPECIALTIES,
  SEED_SQUADRONS,
  SEED_STANDARDS,
  SEED_UNITS,
  SEED_USERS,
  SEED_WEIGHTINGS,
} from './admin.data';

const LATENCY = 140;

export class MockAdminCatalogRepository implements AdminCatalogRepository {
  private users: UserEntity[] = structuredClone(SEED_USERS);
  private roles: UserRoleEntity[] = structuredClone(SEED_ROLES);
  private specialties: SpecialtyEntity[] = structuredClone(SEED_SPECIALTIES);
  private specialtyUsers: SpecialtyUserEntity[] = buildSpecialtyUsers(this.users);
  private units: UnitEntity[] = structuredClone(SEED_UNITS);
  private squadrons: SquadronEntity[] = structuredClone(SEED_SQUADRONS);
  private commissions: TemporaryCommissionEntity[] = structuredClone(SEED_COMMISSIONS);
  private operations: OperationEntity[] = structuredClone(SEED_OPERATIONS);
  private missionTypes: MissionTypeEntity[] = structuredClone(SEED_MISSION_TYPES);
  private maneuvers: ManeuverBankEntity[] = structuredClone(SEED_MANEUVERS);
  private standards: StandardEntity[] = structuredClone(SEED_STANDARDS);
  private weightings: StandardWeightingEntity[] = structuredClone(SEED_WEIGHTINGS);
  private fleets: FleetEntity[] = structuredClone(SEED_FLEETS);
  private aircraft: AircraftEntity[] = structuredClone(SEED_AIRCRAFT);
  private programs: ProgramEntity[] = structuredClone(SEED_PROGRAMS);
  private phases: PhaseEntity[] = structuredClone(SEED_PHASES);
  private subphases: SubphaseEntity[] = structuredClone(SEED_SUBPHASES);
  private phaseBanks: PhaseBankEntity[] = structuredClone(SEED_PHASE_BANKS);
  private subphaseBanks: SubphaseBankEntity[] = structuredClone(SEED_SUBPHASE_BANKS);
  private passwords = new Map(Object.entries(SEED_PASSWORDS));
  private seq = 1;

  listUsers(): Observable<UserEntity[]> {
    return of(this.cloneUsers()).pipe(delay(LATENCY));
  }

  getUser(id: string): Observable<UserEntity> {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos a esa persona.'));
    }
    return of(this.cloneUser(user)).pipe(delay(LATENCY));
  }

  createUser(input: UserWriteInput): Observable<UserEntity> {
    try {
      this.assertUnique(input.email, input.documentNumber);
      const user = this.toUser(`usr-${this.seq++}`, input);
      this.users = [user, ...this.users];
      this.passwords.set(user.id, input.password ?? '');
      this.syncSpecialtyUsers(user);
      return of(this.cloneUser(user)).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateUser(id: string, input: UserWriteInput): Observable<UserEntity> {
    const index = this.users.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos a esa persona.'));
    }
    try {
      this.assertUnique(input.email, input.documentNumber, id);
      const user = this.toUser(id, input);
      this.users[index] = user;
      if (input.password) {
        this.passwords.set(id, input.password);
      }
      this.syncSpecialtyUsers(user);
      return of(this.cloneUser(user)).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listRoles(): Observable<UserRoleEntity[]> {
    return of(this.roles.map((role) => ({ ...role }))).pipe(delay(LATENCY));
  }

  createRole(input: CatalogWriteInput): Observable<UserRoleEntity> {
    try {
      this.assertUniqueName(this.roles, input.name, 'Ya existe un rol con ese nombre.');
      const role: UserRoleEntity = { id: `role-${this.seq++}`, ...input };
      this.roles = [role, ...this.roles];
      return of({ ...role }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateRole(id: string, input: CatalogWriteInput): Observable<UserRoleEntity> {
    const index = this.roles.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos ese rol.'));
    }
    try {
      this.assertUniqueName(this.roles, input.name, 'Ya existe un rol con ese nombre.', id);
      const role: UserRoleEntity = { id, ...input };
      this.roles[index] = role;
      return of({ ...role }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listSpecialties(): Observable<SpecialtyEntity[]> {
    return of(this.specialties.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  listSpecialtyUsers(): Observable<SpecialtyUserEntity[]> {
    return of(this.specialtyUsers.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createSpecialty(input: CatalogWriteInput): Observable<SpecialtyEntity> {
    try {
      this.assertUniqueName(this.specialties, input.name, 'Ya existe una especialidad con ese nombre.');
      const specialty: SpecialtyEntity = { id: `spc-${this.seq++}`, ...input };
      this.specialties = [specialty, ...this.specialties];
      return of({ ...specialty }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateSpecialty(id: string, input: CatalogWriteInput): Observable<SpecialtyEntity> {
    const index = this.specialties.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos esa especialidad.'));
    }
    try {
      this.assertUniqueName(this.specialties, input.name, 'Ya existe una especialidad con ese nombre.', id);
      const specialty: SpecialtyEntity = { id, ...input };
      this.specialties[index] = specialty;
      return of({ ...specialty }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listUnits(): Observable<UnitEntity[]> {
    return of(this.units.map((unit) => ({ ...unit }))).pipe(delay(LATENCY));
  }

  createUnit(input: UnitWriteInput): Observable<UnitEntity> {
    try {
      this.assertUniqueCode(this.units, input.code, 'Ya existe una unidad con ese código.');
      const unit: UnitEntity = { id: `unit-${this.seq++}`, ...input };
      this.units = [unit, ...this.units];
      return of({ ...unit }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateUnit(id: string, input: UnitWriteInput): Observable<UnitEntity> {
    const index = this.units.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos esa unidad.'));
    }
    try {
      this.assertUniqueCode(this.units, input.code, 'Ya existe una unidad con ese código.', id);
      const unit: UnitEntity = { id, ...input };
      this.units[index] = unit;
      return of({ ...unit }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listSquadrons(): Observable<SquadronEntity[]> {
    return of(this.squadrons.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createSquadron(input: SquadronWriteInput): Observable<SquadronEntity> {
    try {
      this.assertUnitExists(input.unitId);
      this.assertUniqueCode(this.squadrons, input.code, 'Ya existe un escuadrón con ese código.');
      const squadron: SquadronEntity = { id: `sq-${this.seq++}`, ...input };
      this.squadrons = [squadron, ...this.squadrons];
      return of({ ...squadron }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateSquadron(id: string, input: SquadronWriteInput): Observable<SquadronEntity> {
    const index = this.squadrons.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos ese escuadrón.'));
    }
    try {
      this.assertUnitExists(input.unitId);
      this.assertUniqueCode(this.squadrons, input.code, 'Ya existe un escuadrón con ese código.', id);
      const squadron: SquadronEntity = { id, ...input };
      this.squadrons[index] = squadron;
      return of({ ...squadron }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listTemporaryCommissions(): Observable<TemporaryCommissionEntity[]> {
    return of(this.commissions.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createTemporaryCommission(input: TemporaryCommissionWriteInput): Observable<TemporaryCommissionEntity> {
    try {
      this.assertCommissionRefs(input);
      const commission: TemporaryCommissionEntity = { id: `com-${this.seq++}`, ...input };
      this.commissions = [commission, ...this.commissions];
      return of({ ...commission }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateTemporaryCommission(id: string, input: TemporaryCommissionWriteInput): Observable<TemporaryCommissionEntity> {
    const index = this.commissions.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos esa comisión.'));
    }
    try {
      this.assertCommissionRefs(input);
      const commission: TemporaryCommissionEntity = { id, ...input };
      this.commissions[index] = commission;
      return of({ ...commission }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listOperations(): Observable<OperationEntity[]> {
    return of(this.operations.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createOperation(input: CatalogWriteInput): Observable<OperationEntity> {
    try {
      this.assertUniqueName(this.operations, input.name, 'Ya existe una operación con ese nombre.');
      const item: OperationEntity = { id: `op-${this.seq++}`, ...input };
      this.operations = [item, ...this.operations];
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateOperation(id: string, input: CatalogWriteInput): Observable<OperationEntity> {
    const index = this.operations.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos esa operación.'));
    }
    try {
      this.assertUniqueName(this.operations, input.name, 'Ya existe una operación con ese nombre.', id);
      const item: OperationEntity = { id, ...input };
      this.operations[index] = item;
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listMissionTypes(): Observable<MissionTypeEntity[]> {
    return of(this.missionTypes.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createMissionType(input: MissionTypeWriteInput): Observable<MissionTypeEntity> {
    try {
      this.assertUniqueCode(this.missionTypes, input.code, 'Ya existe un tipo de misión con ese código.');
      const item: MissionTypeEntity = { id: `mt-${this.seq++}`, ...input };
      this.missionTypes = [item, ...this.missionTypes];
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateMissionType(id: string, input: MissionTypeWriteInput): Observable<MissionTypeEntity> {
    const index = this.missionTypes.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos ese tipo de misión.'));
    }
    try {
      this.assertUniqueCode(this.missionTypes, input.code, 'Ya existe un tipo de misión con ese código.', id);
      const item: MissionTypeEntity = { id, ...input };
      this.missionTypes[index] = item;
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listManeuvers(): Observable<ManeuverBankEntity[]> {
    return of(this.maneuvers.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createManeuver(input: ManeuverBankWriteInput): Observable<ManeuverBankEntity> {
    try {
      this.assertOperationExists(input.operationId);
      this.assertUniqueCode(this.maneuvers, input.code, 'Ya existe una maniobra con ese código.');
      const item: ManeuverBankEntity = { id: `man-${this.seq++}`, ...input };
      this.maneuvers = [item, ...this.maneuvers];
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateManeuver(id: string, input: ManeuverBankWriteInput): Observable<ManeuverBankEntity> {
    const index = this.maneuvers.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos esa maniobra.'));
    }
    try {
      this.assertOperationExists(input.operationId);
      this.assertUniqueCode(this.maneuvers, input.code, 'Ya existe una maniobra con ese código.', id);
      const item: ManeuverBankEntity = { id, ...input };
      this.maneuvers[index] = item;
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listStandards(): Observable<StandardEntity[]> {
    return of(this.standards.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createStandard(input: StandardWriteInput): Observable<StandardEntity> {
    try {
      this.assertUniqueCode(this.standards, input.code, 'Ya existe un estándar con ese código.');
      const item: StandardEntity = { id: `std-${this.seq++}`, ...input };
      this.standards = [item, ...this.standards];
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateStandard(id: string, input: StandardWriteInput): Observable<StandardEntity> {
    const index = this.standards.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos ese estándar.'));
    }
    try {
      this.assertUniqueCode(this.standards, input.code, 'Ya existe un estándar con ese código.', id);
      const item: StandardEntity = { id, ...input };
      this.standards[index] = item;
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listWeightings(): Observable<StandardWeightingEntity[]> {
    return of(this.weightings.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createWeighting(input: StandardWeightingWriteInput): Observable<StandardWeightingEntity> {
    try {
      this.assertWeightingRefs(input);
      const item: StandardWeightingEntity = { id: `w-${this.seq++}`, ...input };
      this.weightings = [item, ...this.weightings];
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateWeighting(id: string, input: StandardWeightingWriteInput): Observable<StandardWeightingEntity> {
    const index = this.weightings.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos esa ponderación.'));
    }
    try {
      this.assertWeightingRefs(input);
      const item: StandardWeightingEntity = { id, ...input };
      this.weightings[index] = item;
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listFleets(): Observable<FleetEntity[]> {
    return of(this.fleets.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createFleet(input: FleetWriteInput): Observable<FleetEntity> {
    try {
      this.assertUniqueCode(this.fleets, input.code, 'Ya existe una flota con ese código.');
      const item: FleetEntity = { id: `fleet-${this.seq++}`, ...input };
      this.fleets = [item, ...this.fleets];
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateFleet(id: string, input: FleetWriteInput): Observable<FleetEntity> {
    const index = this.fleets.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos esa flota.'));
    }
    try {
      this.assertUniqueCode(this.fleets, input.code, 'Ya existe una flota con ese código.', id);
      const item: FleetEntity = { id, ...input };
      this.fleets[index] = item;
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listAircraft(): Observable<AircraftEntity[]> {
    return of(this.aircraft.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createAircraft(input: AircraftWriteInput): Observable<AircraftEntity> {
    try {
      this.assertAircraftRefs(input);
      this.assertUniqueRegistration(input.registration);
      const item: AircraftEntity = { id: `ac-${this.seq++}`, ...input };
      this.aircraft = [item, ...this.aircraft];
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateAircraft(id: string, input: AircraftWriteInput): Observable<AircraftEntity> {
    const index = this.aircraft.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos esa aeronave.'));
    }
    try {
      this.assertAircraftRefs(input);
      this.assertUniqueRegistration(input.registration, id);
      const item: AircraftEntity = { id, ...input };
      this.aircraft[index] = item;
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listPrograms(): Observable<ProgramEntity[]> {
    return of(this.programs.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  listPhases(): Observable<PhaseEntity[]> {
    return of(this.phases.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  listSubphases(): Observable<SubphaseEntity[]> {
    return of(
      this.subphases.map((item) => ({
        ...item,
        missionTypeIds: [...item.missionTypeIds],
        customMissionNames: [...item.customMissionNames],
        maneuverIds: [...item.maneuverIds],
        maneuverOperationIds: [...item.maneuverOperationIds],
        maneuverAssignment: { ...item.maneuverAssignment },
      })),
    ).pipe(delay(LATENCY));
  }

  listPhaseBanks(): Observable<PhaseBankEntity[]> {
    return of(this.phaseBanks.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createPhaseBank(input: PhaseBankWriteInput): Observable<PhaseBankEntity> {
    try {
      this.assertUniqueCode(this.phaseBanks, input.code, 'Ya existe un banco de fase con ese código.');
      const item: PhaseBankEntity = { id: `pb-${this.seq++}`, ...input };
      this.phaseBanks = [item, ...this.phaseBanks];
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updatePhaseBank(id: string, input: PhaseBankWriteInput): Observable<PhaseBankEntity> {
    const index = this.phaseBanks.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos ese banco de fase.'));
    }
    try {
      this.assertUniqueCode(this.phaseBanks, input.code, 'Ya existe un banco de fase con ese código.', id);
      const item: PhaseBankEntity = { id, ...input };
      this.phaseBanks[index] = item;
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  listSubphaseBanks(): Observable<SubphaseBankEntity[]> {
    return of(this.subphaseBanks.map((item) => ({ ...item }))).pipe(delay(LATENCY));
  }

  createSubphaseBank(input: SubphaseBankWriteInput): Observable<SubphaseBankEntity> {
    try {
      this.assertUniqueCode(this.subphaseBanks, input.code, 'Ya existe un banco de subfase con ese código.');
      const item: SubphaseBankEntity = { id: `sb-${this.seq++}`, ...input };
      this.subphaseBanks = [item, ...this.subphaseBanks];
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateSubphaseBank(id: string, input: SubphaseBankWriteInput): Observable<SubphaseBankEntity> {
    const index = this.subphaseBanks.findIndex((item) => item.id === id);
    if (index < 0) {
      return throwError(() => new InvalidAdminCatalogError('No encontramos ese banco de subfase.'));
    }
    try {
      this.assertUniqueCode(this.subphaseBanks, input.code, 'Ya existe un banco de subfase con ese código.', id);
      const item: SubphaseBankEntity = { id, ...input };
      this.subphaseBanks[index] = item;
      return of({ ...item }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  saveProgramCurriculum(input: ProgramCurriculumWriteInput): Observable<ProgramEntity> {
    try {
      if (input.id && !this.programs.some((item) => item.id === input.id)) {
        throw new InvalidAdminCatalogError('No encontramos ese programa.');
      }
      const programId = input.id ?? `prg-${this.seq++}`;
      this.assertUniqueCode(this.programs, input.program.code, 'Ya existe un programa con ese código.', programId);
      this.assertCurriculumRefs(input);
      const program: ProgramEntity = {
        id: programId,
        ...input.program,
        imageUrl: input.program.imageUrl ?? `/programs/${input.program.programType.toLowerCase()}.jpg`,
      };
      const nextPhases: PhaseEntity[] = [];
      const nextSubphases: SubphaseEntity[] = [];
      input.phases.forEach((phaseDraft, phaseIndex) => {
        const phaseId = `ph-${this.seq++}`;
        nextPhases.push({
          id: phaseId,
          programId,
          phaseBankId: phaseDraft.phaseBankId,
          sortOrder: phaseIndex + 1,
        });
        phaseDraft.subphases.forEach((subDraft, subIndex) => {
          nextSubphases.push({
            id: `sp-${this.seq++}`,
            phaseId,
            subphaseBankId: subDraft.subphaseBankId,
            hours: subDraft.hours,
            missionMode: subDraft.missionMode,
            missionTypeIds: [...subDraft.missionTypeIds],
            customMissionNames: [...subDraft.customMissionNames],
            autoMissionCode: subDraft.autoMissionCode,
            autoMissionCount: subDraft.autoMissionCount,
            maneuverIds: [...subDraft.maneuverIds],
            maneuverOperationIds: [...(subDraft.maneuverOperationIds ?? [])],
            maneuverAssignment: { ...(subDraft.maneuverAssignment ?? {}) },
            sortOrder: subIndex + 1,
          });
        });
      });
      const keepPhaseIds = new Set(this.phases.filter((item) => item.programId !== programId).map((item) => item.id));
      this.programs = input.id
        ? this.programs.map((item) => (item.id === programId ? program : item))
        : [program, ...this.programs];
      this.phases = [...this.phases.filter((item) => item.programId !== programId), ...nextPhases];
      this.subphases = [
        ...this.subphases.filter((item) => keepPhaseIds.has(item.phaseId)),
        ...nextSubphases,
      ];
      return of({ ...program }).pipe(delay(LATENCY));
    } catch (error) {
      return throwError(() => error);
    }
  }

  private assertCurriculumRefs(input: ProgramCurriculumWriteInput): void {
    for (const phase of input.phases) {
      if (!this.phaseBanks.some((item) => item.id === phase.phaseBankId)) {
        throw new InvalidAdminCatalogError('El banco de fase indicado no existe.');
      }
      for (const sub of phase.subphases) {
        if (!this.subphaseBanks.some((item) => item.id === sub.subphaseBankId)) {
          throw new InvalidAdminCatalogError('El banco de subfase indicado no existe.');
        }
        if (sub.missionMode === 'manual') {
          for (const missionId of sub.missionTypeIds) {
            if (!this.missionTypes.some((item) => item.id === missionId)) {
              throw new InvalidAdminCatalogError('Una de las misiones indicadas no existe.');
            }
          }
        }
        for (const maneuverId of sub.maneuverIds) {
          if (!this.maneuvers.some((item) => item.id === maneuverId)) {
            throw new InvalidAdminCatalogError('Una de las maniobras indicadas no existe.');
          }
        }
        for (const operationId of sub.maneuverOperationIds ?? []) {
          this.assertOperationExists(operationId);
        }
      }
    }
  }

  private assertAircraftRefs(input: AircraftWriteInput): void {
    this.assertUnitExists(input.unitId);
    if (!this.fleets.some((item) => item.id === input.fleetId)) {
      throw new InvalidAdminCatalogError('La flota indicada no existe.');
    }
  }

  private assertUniqueRegistration(registration: string, ignoreId?: string): void {
    const clash = this.aircraft.find(
      (item) => item.id !== ignoreId && item.registration.trim().toUpperCase() === registration.trim().toUpperCase(),
    );
    if (clash) {
      throw new InvalidAdminCatalogError('Ya existe una aeronave con esa matrícula.');
    }
  }

  private assertOperationExists(operationId: string): void {
    if (!this.operations.some((item) => item.id === operationId)) {
      throw new InvalidAdminCatalogError('La operación indicada no existe.');
    }
  }

  private assertWeightingRefs(input: StandardWeightingWriteInput): void {
    if (!this.standards.some((item) => item.id === input.standardId)) {
      throw new InvalidAdminCatalogError('El estándar indicado no existe.');
    }
    this.assertUnitExists(input.unitId);
    const squadron = this.squadrons.find((item) => item.id === input.squadronId);
    if (!squadron) {
      throw new InvalidAdminCatalogError('El escuadrón indicado no existe.');
    }
    if (squadron.unitId !== input.unitId) {
      throw new InvalidAdminCatalogError('El escuadrón no pertenece a esa unidad.');
    }
  }

  private assertUnitExists(unitId: string): void {
    if (!this.units.some((unit) => unit.id === unitId)) {
      throw new InvalidAdminCatalogError('La unidad indicada no existe.');
    }
  }

  private assertCommissionRefs(input: TemporaryCommissionWriteInput): void {
    if (!this.users.some((user) => user.id === input.userId)) {
      throw new InvalidAdminCatalogError('El usuario indicado no existe.');
    }
    this.assertUnitExists(input.originUnitId);
    this.assertUnitExists(input.destinationUnitId);
  }

  private assertUniqueCode(
    items: { id: string; code: string }[],
    code: string,
    message: string,
    ignoreId?: string,
  ): void {
    const clash = items.find(
      (item) => item.id !== ignoreId && item.code.trim().toLowerCase() === code.trim().toLowerCase(),
    );
    if (clash) {
      throw new InvalidAdminCatalogError(message);
    }
  }

  private toUser(id: string, input: UserWriteInput): UserEntity {
    return {
      id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      documentNumber: input.documentNumber,
      entryDate: input.entryDate,
      indicative: input.indicative || null,
      status: input.status,
      roleIds: [...input.roleIds],
      specialtyIds: [...input.specialtyIds],
    };
  }

  private syncSpecialtyUsers(user: UserEntity): void {
    this.specialtyUsers = [
      ...this.specialtyUsers.filter((row) => row.userId !== user.id),
      ...user.specialtyIds.map((specialtyId) => ({
        id: `su-${user.id}-${specialtyId}`,
        userId: user.id,
        specialtyId,
      })),
    ];
  }

  private assertUnique(email: string, documentNumber: string, ignoreId?: string): void {
    const clash = this.users.find(
      (user) =>
        user.id !== ignoreId &&
        (user.email === email || user.documentNumber === documentNumber),
    );
    if (!clash) return;
    if (clash.email === email) {
      throw new InvalidAdminCatalogError('Ya hay una persona con ese correo electrónico.');
    }
    throw new InvalidAdminCatalogError('Ya hay una persona con ese documento.');
  }

  private assertUniqueName(
    items: { id: string; name: string }[],
    name: string,
    message: string,
    ignoreId?: string,
  ): void {
    const clash = items.find(
      (item) => item.id !== ignoreId && item.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (clash) {
      throw new InvalidAdminCatalogError(message);
    }
  }

  private cloneUsers(): UserEntity[] {
    return this.users.map((user) => this.cloneUser(user));
  }

  private cloneUser(user: UserEntity): UserEntity {
    return { ...user, roleIds: [...user.roleIds], specialtyIds: [...user.specialtyIds] };
  }
}

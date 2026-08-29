import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import type {
  CatalogWriteInput,
  SquadronEntity,
  SquadronWriteInput,
  SpecialtyEntity,
  SpecialtyUserEntity,
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
  SEED_COMMISSIONS,
  SEED_PASSWORDS,
  SEED_ROLES,
  SEED_SPECIALTIES,
  SEED_SQUADRONS,
  SEED_UNITS,
  SEED_USERS,
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

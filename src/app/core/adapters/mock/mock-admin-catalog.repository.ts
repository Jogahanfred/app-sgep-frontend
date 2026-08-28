import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import type {
  CatalogWriteInput,
  SpecialtyEntity,
  SpecialtyUserEntity,
  UserEntity,
  UserRoleEntity,
  UserWriteInput,
} from '../../domain/entities/admin-catalog';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import {
  buildSpecialtyUsers,
  SEED_PASSWORDS,
  SEED_ROLES,
  SEED_SPECIALTIES,
  SEED_USERS,
} from './admin.data';

const LATENCY = 140;

export class MockAdminCatalogRepository implements AdminCatalogRepository {
  private users: UserEntity[] = structuredClone(SEED_USERS);
  private roles: UserRoleEntity[] = structuredClone(SEED_ROLES);
  private specialties: SpecialtyEntity[] = structuredClone(SEED_SPECIALTIES);
  private specialtyUsers: SpecialtyUserEntity[] = buildSpecialtyUsers(this.users);
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
    items: Array<{ id: string; name: string }>,
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

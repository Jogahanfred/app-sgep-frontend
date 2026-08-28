import { Observable } from 'rxjs';
import type {
  CatalogWriteInput,
  SpecialtyEntity,
  SpecialtyUserEntity,
  UserEntity,
  UserRoleEntity,
  UserWriteInput,
} from '../domain/entities/admin-catalog';

export interface AdminCatalogRepository {
  listUsers(): Observable<UserEntity[]>;
  getUser(id: string): Observable<UserEntity>;
  createUser(input: UserWriteInput): Observable<UserEntity>;
  updateUser(id: string, input: UserWriteInput): Observable<UserEntity>;

  listRoles(): Observable<UserRoleEntity[]>;
  createRole(input: CatalogWriteInput): Observable<UserRoleEntity>;
  updateRole(id: string, input: CatalogWriteInput): Observable<UserRoleEntity>;

  listSpecialties(): Observable<SpecialtyEntity[]>;
  listSpecialtyUsers(): Observable<SpecialtyUserEntity[]>;
  createSpecialty(input: CatalogWriteInput): Observable<SpecialtyEntity>;
  updateSpecialty(id: string, input: CatalogWriteInput): Observable<SpecialtyEntity>;
}

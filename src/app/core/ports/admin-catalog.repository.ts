import { Observable } from 'rxjs';
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

  listUnits(): Observable<UnitEntity[]>;
  createUnit(input: UnitWriteInput): Observable<UnitEntity>;
  updateUnit(id: string, input: UnitWriteInput): Observable<UnitEntity>;

  listSquadrons(): Observable<SquadronEntity[]>;
  createSquadron(input: SquadronWriteInput): Observable<SquadronEntity>;
  updateSquadron(id: string, input: SquadronWriteInput): Observable<SquadronEntity>;

  listTemporaryCommissions(): Observable<TemporaryCommissionEntity[]>;
  createTemporaryCommission(input: TemporaryCommissionWriteInput): Observable<TemporaryCommissionEntity>;
  updateTemporaryCommission(id: string, input: TemporaryCommissionWriteInput): Observable<TemporaryCommissionEntity>;
}

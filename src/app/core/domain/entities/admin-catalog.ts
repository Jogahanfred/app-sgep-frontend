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

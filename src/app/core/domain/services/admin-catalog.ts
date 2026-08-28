import { InvalidAdminCatalogError } from '../errors/domain-error';
import type { CatalogWriteInput, EntityStatus, UserWriteInput } from '../entities/admin-catalog';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOCUMENT = /^[A-Za-z0-9]{6,16}$/;
const INDICATIVE = /^[A-Za-z0-9-]{2,24}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function required(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new InvalidAdminCatalogError(message);
  }
  return trimmed;
}

function assertStatus(status: EntityStatus): EntityStatus {
  if (status !== 'active' && status !== 'inactive') {
    throw new InvalidAdminCatalogError('El estado debe ser Activo o Inactivo.');
  }
  return status;
}

export function assertPasswordStrength(password: string, requiredMessage: string): string {
  const value = required(password, requiredMessage);
  if (value.length < 8) {
    throw new InvalidAdminCatalogError('La contraseña debe tener al menos 8 caracteres.');
  }
  if (!/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    throw new InvalidAdminCatalogError('Usa mayúscula, número y un símbolo en la contraseña.');
  }
  return value;
}

export function assertUserWrite(input: UserWriteInput, requirePassword: boolean): UserWriteInput {
  const email = required(input.email, 'El correo electrónico es obligatorio.').toLowerCase();
  if (!EMAIL.test(email)) {
    throw new InvalidAdminCatalogError('Necesitamos un correo electrónico válido.');
  }

  const documentNumber = required(input.documentNumber, 'El DNI o documento es obligatorio.').toUpperCase();
  if (!DOCUMENT.test(documentNumber)) {
    throw new InvalidAdminCatalogError('El documento debe tener entre 6 y 16 caracteres alfanuméricos.');
  }

  const entryDate = required(input.entryDate, 'La fecha de ingreso es obligatoria.');
  if (!ISO_DATE.test(entryDate)) {
    throw new InvalidAdminCatalogError('Indica una fecha de ingreso válida.');
  }

  const indicativeRaw = input.indicative.trim();
  if (indicativeRaw && !INDICATIVE.test(indicativeRaw)) {
    throw new InvalidAdminCatalogError('El indicativo solo admite letras, números y guiones (2 a 24).');
  }

  let password: string | undefined;
  if (requirePassword || input.password?.trim()) {
    password = assertPasswordStrength(
      input.password ?? '',
      requirePassword ? 'La contraseña es obligatoria.' : 'Escribe una contraseña válida o déjala vacía.',
    );
  }

  return {
    firstName: required(input.firstName, 'Los nombres son obligatorios.'),
    lastName: required(input.lastName, 'Los apellidos son obligatorios.'),
    email,
    password,
    documentNumber,
    entryDate,
    indicative: indicativeRaw,
    status: assertStatus(input.status),
    roleIds: [...new Set(input.roleIds)],
    specialtyIds: [...new Set(input.specialtyIds)],
  };
}

export function assertCatalogWrite(input: CatalogWriteInput, nameLabel: string): CatalogWriteInput {
  return {
    name: required(input.name, `El nombre ${nameLabel} es obligatorio.`),
    description: input.description.trim(),
    status: assertStatus(input.status),
  };
}

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export function matchesAdminSearch(
  haystack: (string | null | undefined)[],
  query: string,
): boolean {
  const needle = fold(query.trim());
  if (!needle) return true;
  return haystack.some((part) => fold(part ?? '').includes(needle));
}

export function statusLabel(status: EntityStatus): string {
  return status === 'active' ? 'Activo' : 'Inactivo';
}

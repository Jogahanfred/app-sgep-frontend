import { InvalidAdminCatalogError } from '../errors/domain-error';
import type {
  CatalogWriteInput,
  CommissionWorkflowStatus,
  EntityStatus,
  InstructionProgram,
  ManeuverBankWriteInput,
  MissionTypeWriteInput,
  SquadronWriteInput,
  StandardWeightingWriteInput,
  StandardWriteInput,
  TemporaryCommissionWriteInput,
  UnitWriteInput,
  UserWriteInput,
} from '../entities/admin-catalog';
import { COMMISSION_WORKFLOW, INSTRUCTION_PROGRAMS } from '../entities/admin-catalog';

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

export function passwordStrengthError(password: string, requiredPassword: boolean): string | undefined {
  if (!requiredPassword && !password.trim()) return undefined;
  try {
    assertPasswordStrength(password, 'La contraseña es obligatoria.');
    return undefined;
  } catch (err) {
    return err instanceof Error ? err.message : 'Contraseña inválida.';
  }
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

function assertCode(value: string, label: string): string {
  const code = required(value, `El código ${label} es obligatorio.`).toUpperCase();
  if (!/^[A-Z0-9-]{2,16}$/.test(code)) {
    throw new InvalidAdminCatalogError(`El código ${label} solo admite letras, números y guiones (2 a 16).`);
  }
  return code;
}

export function assertUnitWrite(input: UnitWriteInput): UnitWriteInput {
  const abbreviation = required(input.abbreviation, 'La abreviatura es obligatoria.').toUpperCase();
  if (!/^[A-Z0-9-]{1,8}$/.test(abbreviation)) {
    throw new InvalidAdminCatalogError('La abreviatura solo admite letras, números y guiones (1 a 8).');
  }
  return {
    code: assertCode(input.code, 'de la unidad'),
    name: required(input.name, 'El nombre de la unidad es obligatorio.'),
    abbreviation,
    status: assertStatus(input.status),
  };
}

export function assertSquadronWrite(input: SquadronWriteInput): SquadronWriteInput {
  return {
    unitId: required(input.unitId, 'La unidad es obligatoria.'),
    code: assertCode(input.code, 'del escuadrón'),
    name: required(input.name, 'El nombre del escuadrón es obligatorio.'),
    description: input.description.trim(),
    status: assertStatus(input.status),
  };
}

function assertWorkflow(status: CommissionWorkflowStatus): CommissionWorkflowStatus {
  if (!COMMISSION_WORKFLOW.includes(status)) {
    throw new InvalidAdminCatalogError('El estado de la comisión no es válido.');
  }
  return status;
}

export function assertCommissionWrite(input: TemporaryCommissionWriteInput): TemporaryCommissionWriteInput {
  const originUnitId = required(input.originUnitId, 'La unidad de origen es obligatoria.');
  const destinationUnitId = required(input.destinationUnitId, 'La unidad de destino es obligatoria.');
  if (originUnitId === destinationUnitId) {
    throw new InvalidAdminCatalogError('La unidad de destino debe ser distinta a la de origen.');
  }
  const startDate = required(input.startDate, 'La fecha de inicio es obligatoria.');
  const endDate = required(input.endDate, 'La fecha de fin es obligatoria.');
  if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) {
    throw new InvalidAdminCatalogError('Indica fechas de comisión válidas.');
  }
  if (endDate < startDate) {
    throw new InvalidAdminCatalogError('La fecha de fin no puede ser anterior al inicio.');
  }
  return {
    userId: required(input.userId, 'El usuario es obligatorio.'),
    originUnitId,
    destinationUnitId,
    startDate,
    endDate,
    reason: required(input.reason, 'El motivo es obligatorio.'),
    status: assertWorkflow(input.status),
  };
}

export function assertMissionTypeWrite(input: MissionTypeWriteInput): MissionTypeWriteInput {
  return {
    code: assertCode(input.code, 'del tipo de misión'),
    name: required(input.name, 'El nombre del tipo de misión es obligatorio.'),
    description: input.description.trim(),
  };
}

export function assertManeuverWrite(input: ManeuverBankWriteInput): ManeuverBankWriteInput {
  return {
    operationId: required(input.operationId, 'La operación es obligatoria.'),
    code: assertCode(input.code, 'de la maniobra'),
    name: required(input.name, 'El nombre de la maniobra es obligatorio.'),
    description: input.description.trim(),
  };
}

export function assertStandardWrite(input: StandardWriteInput): StandardWriteInput {
  const sortOrder = Number(input.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 1) {
    throw new InvalidAdminCatalogError('El orden del estándar debe ser un entero mayor que 0.');
  }
  return {
    code: assertCode(input.code, 'del estándar'),
    name: required(input.name, 'El nombre del estándar es obligatorio.'),
    description: input.description.trim(),
    sortOrder,
  };
}

export function assertWeightingWrite(input: StandardWeightingWriteInput): StandardWeightingWriteInput {
  const program = required(input.program, 'El programa es obligatorio.') as InstructionProgram;
  if (!INSTRUCTION_PROGRAMS.includes(program)) {
    throw new InvalidAdminCatalogError('El programa debe ser PPL, CPL, ATPL o IR.');
  }
  const weightedValue = Number(input.weightedValue);
  if (!Number.isFinite(weightedValue) || weightedValue < 0 || weightedValue > 100) {
    throw new InvalidAdminCatalogError('El valor ponderado debe estar entre 0 y 100.');
  }
  const validFrom = required(input.validFrom, 'La fecha de inicio de vigencia es obligatoria.');
  const validTo = required(input.validTo, 'La fecha de fin de vigencia es obligatoria.');
  if (!ISO_DATE.test(validFrom) || !ISO_DATE.test(validTo)) {
    throw new InvalidAdminCatalogError('Indica un periodo de vigencia válido.');
  }
  if (validTo < validFrom) {
    throw new InvalidAdminCatalogError('La vigencia no puede terminar antes de empezar.');
  }
  return {
    standardId: required(input.standardId, 'El estándar es obligatorio.'),
    unitId: required(input.unitId, 'La unidad es obligatoria.'),
    squadronId: required(input.squadronId, 'El escuadrón es obligatorio.'),
    program,
    weightedValue: Math.round(weightedValue * 10) / 10,
    validFrom,
    validTo,
  };
}

export function weightingIsCurrent(validTo: string, today = new Date().toISOString().slice(0, 10)): boolean {
  return validTo >= today;
}

export function commissionStatusLabel(status: CommissionWorkflowStatus): string {
  const labels: Record<CommissionWorkflowStatus, string> = {
    registered: 'Registrado',
    approved: 'Aprobado',
    active: 'Activo',
    finished: 'Finalizado',
  };
  return labels[status];
}

export function commissionEventTitle(status: CommissionWorkflowStatus): string {
  const titles: Record<CommissionWorkflowStatus, string> = {
    registered: 'Comisión registrada',
    approved: 'Comisión aprobada',
    active: 'Comisión activa',
    finished: 'Comisión finalizada',
  };
  return titles[status];
}

export function nextCommissionStatus(status: CommissionWorkflowStatus): CommissionWorkflowStatus | null {
  const index = COMMISSION_WORKFLOW.indexOf(status);
  return index >= 0 && index < COMMISSION_WORKFLOW.length - 1 ? COMMISSION_WORKFLOW[index + 1] : null;
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

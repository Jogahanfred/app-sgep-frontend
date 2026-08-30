import { InvalidAdminCatalogError } from '../errors/domain-error';
import type {
  AircraftWriteInput,
  CatalogWriteInput,
  CommissionWorkflowStatus,
  EntityStatus,
  FleetType,
  FleetWriteInput,
  InstructionProgram,
  ManeuverBankWriteInput,
  MissionAssignMode,
  MissionTypeWriteInput,
  PhaseBankWriteInput,
  PhaseDraftInput,
  ProgramCurriculumWriteInput,
  ProgramType,
  ProgramWriteInput,
  SubphaseBankWriteInput,
  SubphaseDraftInput,
  SquadronWriteInput,
  StandardWeightingWriteInput,
  StandardWriteInput,
  TemporaryCommissionWriteInput,
  UnitWriteInput,
  UserWriteInput,
} from '../entities/admin-catalog';
import {
  AUTO_MISSION_COUNT_MAX,
  COMMISSION_WORKFLOW,
  FLEET_TYPES,
  INSTRUCTION_PROGRAMS,
  MISSION_ASSIGN_MODES,
  PROGRAM_TYPES,
} from '../entities/admin-catalog';

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

export function programTypeLabel(type: ProgramType): string {
  const labels: Record<ProgramType, string> = {
    PPL: 'PPL · Piloto privado',
    CPL: 'CPL · Piloto comercial',
    ATPL: 'ATPL · Transporte de línea',
    IR: 'IR · Habilitación instrumental',
    FI: 'FI · Instructor de vuelo',
  };
  return labels[type];
}

export function programCoverUrl(type: ProgramType, imageUrl?: string): string {
  const custom = imageUrl?.trim();
  if (custom) return custom;
  return `/programs/${type.toLowerCase()}.jpg`;
}

export function assertPhaseBankWrite(input: PhaseBankWriteInput): PhaseBankWriteInput {
  return {
    code: assertCode(input.code, 'del banco de fase'),
    name: required(input.name, 'El nombre del banco de fase es obligatorio.'),
    description: input.description.trim(),
    status: assertStatus(input.status),
  };
}

export function assertSubphaseBankWrite(input: SubphaseBankWriteInput): SubphaseBankWriteInput {
  return {
    code: assertCode(input.code, 'del banco de subfase'),
    name: required(input.name, 'El nombre del banco de subfase es obligatorio.'),
    description: input.description.trim(),
    status: assertStatus(input.status),
  };
}

export function assertProgramWrite(input: ProgramWriteInput): ProgramWriteInput {
  const programType = required(input.programType, 'El tipo de programa es obligatorio.') as ProgramType;
  if (!PROGRAM_TYPES.includes(programType)) {
    throw new InvalidAdminCatalogError('El tipo debe ser PPL, CPL, ATPL, IR o FI.');
  }
  return {
    code: assertCode(input.code, 'del programa'),
    name: required(input.name, 'El nombre del programa es obligatorio.'),
    programType,
    description: input.description.trim(),
    status: assertStatus(input.status),
    imageUrl: programCoverUrl(programType, input.imageUrl),
  };
}

export function expandAutoMissions(code: string, count: number): string[] {
  const raw = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const letter = raw.match(/[A-Z]/)?.[0];
  if (!letter || !Number.isInteger(count) || count < 1) return [];
  const limited = Math.min(count, AUTO_MISSION_COUNT_MAX);
  return Array.from({ length: limited }, (_, index) => `${letter}${index + 1}`);
}

export function assertSubphaseDraft(input: SubphaseDraftInput): SubphaseDraftInput {
  const hours = Number(input.hours);
  if (!Number.isFinite(hours) || hours < 0.5 || hours > 200) {
    throw new InvalidAdminCatalogError('Las horas de la subfase deben estar entre 0,5 y 200.');
  }
  const sortOrder = Number(input.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 1) {
    throw new InvalidAdminCatalogError('El orden de la subfase debe ser un entero a partir de 1.');
  }
  const missionMode = (input.missionMode || 'manual') as MissionAssignMode;
  if (!MISSION_ASSIGN_MODES.includes(missionMode)) {
    throw new InvalidAdminCatalogError('Las misiones se crean en modo manual o automático.');
  }
  const customMissionNames = [
    ...new Set((input.customMissionNames ?? []).map((name) => name.trim()).filter(Boolean)),
  ];
  if (customMissionNames.some((name) => name.length > 40)) {
    throw new InvalidAdminCatalogError('El nombre de cada misión no puede superar 40 caracteres.');
  }
  let autoMissionCode = '';
  let autoMissionCount = 0;
  let missionTypeIds = [...new Set((input.missionTypeIds ?? []).filter(Boolean))];
  if (missionMode === 'automatic') {
    autoMissionCode = required(input.autoMissionCode, 'El código de la serie de misiones es obligatorio.')
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '');
    if (!/[A-Z]/.test(autoMissionCode)) {
      throw new InvalidAdminCatalogError('El código automático debe incluir al menos una letra. Ejemplo: CER.');
    }
    autoMissionCount = Number(input.autoMissionCount);
    if (!Number.isInteger(autoMissionCount) || autoMissionCount < 1 || autoMissionCount > AUTO_MISSION_COUNT_MAX) {
      throw new InvalidAdminCatalogError(`La cantidad automática debe ser un entero entre 1 y ${AUTO_MISSION_COUNT_MAX}.`);
    }
    missionTypeIds = [];
  }
  return {
    subphaseBankId: required(input.subphaseBankId, 'El banco de subfase es obligatorio.'),
    hours: Math.round(hours * 10) / 10,
    missionMode,
    missionTypeIds,
    customMissionNames: missionMode === 'manual' ? customMissionNames : [],
    autoMissionCode: missionMode === 'automatic' ? autoMissionCode : '',
    autoMissionCount: missionMode === 'automatic' ? autoMissionCount : 0,
    maneuverIds: [...new Set(input.maneuverIds.filter(Boolean))],
    maneuverOperationIds: [...new Set((input.maneuverOperationIds ?? []).filter(Boolean))],
    maneuverAssignment: sanitizeManeuverAssignment(
      input.maneuverAssignment ?? {},
      [...new Set(input.maneuverIds.filter(Boolean))],
      [...new Set((input.maneuverOperationIds ?? []).filter(Boolean))],
    ),
    sortOrder,
  };
}

function sanitizeManeuverAssignment(
  assignment: Record<string, string>,
  maneuverIds: readonly string[],
  operationIds: readonly string[],
): Record<string, string> {
  const maneuvers = new Set(maneuverIds);
  const operations = new Set(operationIds);
  const next: Record<string, string> = {};
  for (const [maneuverId, operationId] of Object.entries(assignment)) {
    if (maneuvers.has(maneuverId) && operations.has(operationId)) next[maneuverId] = operationId;
  }
  return next;
}

export function assertPhaseDraft(input: PhaseDraftInput): PhaseDraftInput {
  const sortOrder = Number(input.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 1) {
    throw new InvalidAdminCatalogError('El orden de la fase debe ser un entero a partir de 1.');
  }
  if (!input.subphases.length) {
    throw new InvalidAdminCatalogError('Cada fase necesita al menos una subfase.');
  }
  return {
    phaseBankId: required(input.phaseBankId, 'El banco de fase es obligatorio.'),
    sortOrder,
    subphases: input.subphases.map((item, index) => assertSubphaseDraft({ ...item, sortOrder: index + 1 })),
  };
}

export function assertProgramCurriculumWrite(input: ProgramCurriculumWriteInput): ProgramCurriculumWriteInput {
  return {
    id: input.id?.trim() || undefined,
    program: assertProgramWrite(input.program),
    phases: input.phases.map((item, index) => assertPhaseDraft({ ...item, sortOrder: index + 1 })),
  };
}

export function curriculumHours(phases: { subphases: { hours: number }[] }[]): number {
  return phases.reduce((total, phase) => total + phase.subphases.reduce((sum, item) => sum + item.hours, 0), 0);
}

export function fleetTypeLabel(type: FleetType): string {
  const labels: Record<FleetType, string> = {
    'fixed-wing': 'Ala fija',
    rotary: 'Ala rotatoria',
    uas: 'UAS',
  };
  return labels[type];
}

export function operationalLabel(operational: boolean): string {
  return operational ? 'Operativa' : 'No operativa';
}

export function assertFleetWrite(input: FleetWriteInput): FleetWriteInput {
  const fleetType = required(input.fleetType, 'El tipo de flota es obligatorio.') as FleetType;
  if (!FLEET_TYPES.includes(fleetType)) {
    throw new InvalidAdminCatalogError('El tipo de flota debe ser Ala fija, Ala rotatoria o UAS.');
  }
  return {
    fleetType,
    code: assertCode(input.code, 'de la flota'),
    name: required(input.name, 'El nombre de la flota es obligatorio.'),
    description: input.description.trim(),
    status: assertStatus(input.status),
  };
}

export function assertAircraftWrite(input: AircraftWriteInput): AircraftWriteInput {
  const registration = required(input.registration, 'La matrícula es obligatoria.').toUpperCase();
  if (!/^[A-Z]{1,2}-[A-Z0-9]{3,5}$/.test(registration)) {
    throw new InvalidAdminCatalogError('La matrícula debe tener el formato EC-HVA.');
  }
  return {
    unitId: required(input.unitId, 'La unidad es obligatoria.'),
    fleetId: required(input.fleetId, 'La flota es obligatoria.'),
    registration,
    operational: Boolean(input.operational),
    status: assertStatus(input.status),
    imageUrl: assertAircraftImage(input.imageUrl),
  };
}

function assertAircraftImage(value: string): string {
  const imageUrl = value.trim();
  if (!imageUrl) {
    throw new InvalidAdminCatalogError('La aeronave necesita una imagen para identificarla.');
  }
  if (imageUrl.startsWith('data:image/')) {
    if (imageUrl.length > 2_800_000) {
      throw new InvalidAdminCatalogError('La imagen no puede superar 2 MB.');
    }
    return imageUrl;
  }
  if (imageUrl.startsWith('/')) return imageUrl;
  throw new InvalidAdminCatalogError('La imagen debe ser un archivo JPEG, PNG o WebP.');
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

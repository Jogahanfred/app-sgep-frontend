import { InvalidAdminCatalogError } from '../errors/domain-error';
import type {
  AircraftWriteInput,
  CatalogWriteInput,
  CommissionWorkflowStatus,
  DirbeDangerousOutcome,
  DirbeLevel,
  EntityStatus,
  FleetType,
  FleetWriteInput,
  InstructionProgram,
  ManeuverBankWriteInput,
  ManeuverStandardAssignment,
  MissionAssignMode,
  MissionTypeWriteInput,
  PhaseBankWriteInput,
  PhaseDraftInput,
  ProgramCurriculumWriteInput,
  ProgramLifecycleFlag,
  ProgramModuleKind,
  ProgramStandardMatrixWriteInput,
  ProgramType,
  ProgramWriteInput,
  SubphaseBankEntity,
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
  DIRBE_DANGEROUS_OUTCOMES,
  DIRBE_LEVELS,
  FLEET_TYPES,
  INSTRUCTION_PROGRAMS,
  MISSION_ASSIGN_MODES,
  PROGRAM_MODULE_KINDS,
  PROGRAM_TYPES,
  PROGRAM_LIFECYCLE_FLAG,
  PROGRAM_LIFECYCLE_FLAGS,
} from '../entities/admin-catalog';
import { assertGroundPeriodicExams } from './ground-instruction-grade';

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
    assignedUnitId: input.assignedUnitId,
    assignedSquadronId: input.assignedSquadronId,
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

function assertAcademicCode(value: string, label: string): string {
  const code = required(value, `El código ${label} es obligatorio.`).toUpperCase();
  if (!/^[A-Z0-9/-]{2,16}$/.test(code)) {
    throw new InvalidAdminCatalogError(
      `El código ${label} solo admite letras, números, guiones y diagonales (2 a 16).`,
    );
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
    imageUrl: input.imageUrl,
  };
}

export function assertSquadronWrite(input: SquadronWriteInput): SquadronWriteInput {
  return {
    unitId: required(input.unitId, 'La unidad es obligatoria.'),
    code: assertCode(input.code, 'del escuadrón'),
    name: required(input.name, 'El nombre del escuadrón es obligatorio.'),
    description: input.description.trim(),
    status: assertStatus(input.status),
    imageUrl: input.imageUrl,
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
    code: assertAcademicCode(input.code, 'del tipo de misión'),
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
    HELI: 'HELI · Piloto de helicóptero',
  };
  return labels[type];
}

export function programCoverUrl(type: ProgramType, imageUrl?: string): string {
  const custom = assertOptionalProgramImage(imageUrl);
  if (custom) return custom;
  return `/programs/${type.toLowerCase()}.jpg`;
}

function assertOptionalProgramImage(value?: string): string {
  const imageUrl = value?.trim() ?? '';
  if (!imageUrl) return '';
  if (imageUrl.startsWith('data:image/')) {
    if (imageUrl.length > 2_800_000) {
      throw new InvalidAdminCatalogError('La imagen no puede superar 2 MB.');
    }
    return imageUrl;
  }
  if (imageUrl.startsWith('/')) return imageUrl;
  throw new InvalidAdminCatalogError('La imagen debe ser un archivo JPEG, PNG o WebP.');
}

export function assertPhaseBankWrite(input: PhaseBankWriteInput): PhaseBankWriteInput {
  return {
    code: assertAcademicCode(input.code, 'del banco de fase'),
    name: required(input.name, 'El nombre del banco de fase es obligatorio.'),
    description: input.description.trim(),
    status: assertStatus(input.status),
  };
}

export function assertSubphaseBankWrite(input: SubphaseBankWriteInput): SubphaseBankWriteInput {
  const coefficient = assertOptionalCoefficient(input.coefficient);
  const minPassingGrade = assertOptionalMinPassingGrade(input.minPassingGrade);
  return {
    code: assertAcademicCode(input.code, 'del banco de subfase'),
    name: required(input.name, 'El nombre del banco de subfase es obligatorio.'),
    description: input.description.trim(),
    status: assertStatus(input.status),
    ...(coefficient !== undefined ? { coefficient } : {}),
    ...(minPassingGrade !== undefined ? { minPassingGrade } : {}),
  };
}

function assertOptionalCoefficient(value: number | undefined): number | undefined {
  if (value === undefined || value === null || (typeof value === 'number' && Number.isNaN(value))) {
    return undefined;
  }
  const coefficient = Number(value);
  if (!Number.isFinite(coefficient) || coefficient < 0 || coefficient > 1) {
    throw new InvalidAdminCatalogError('El coeficiente NCT debe estar entre 0 y 1.');
  }
  return coefficient;
}

function assertOptionalMinPassingGrade(value: number | undefined): number | undefined {
  if (value === undefined || value === null || (typeof value === 'number' && Number.isNaN(value))) {
    return undefined;
  }
  const grade = Number(value);
  if (!Number.isFinite(grade) || grade < 0 || grade > 20) {
    throw new InvalidAdminCatalogError('La nota mínima debe estar entre 0 y 20.');
  }
  return grade;
}

export function assertProgramStandardIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

export function assertProgramWrite(input: ProgramWriteInput): ProgramWriteInput {
  const programType = required(input.programType, 'El tipo de programa es obligatorio.') as ProgramType;
  if (!PROGRAM_TYPES.includes(programType)) {
    throw new InvalidAdminCatalogError('El tipo debe ser PPL, CPL, ATPL, IR, FI o HELI.');
  }
  return {
    code: assertCode(input.code, 'del programa'),
    name: required(input.name, 'El nombre del programa es obligatorio.'),
    programType,
    description: input.description.trim(),
    status: assertStatus(input.status),
    imageUrl: programCoverUrl(programType, input.imageUrl),
    ...(input.standardIds ? { standardIds: [...input.standardIds] } : {}),
    ...(input.academicYear ? { academicYear: input.academicYear } : {}),
    lifecycleFlag: normalizeProgramLifecycleFlag(input.lifecycleFlag),
    groundPeriodicExams: assertGroundPeriodicExams(input.groundPeriodicExams),
  };
}

export const PROGRAM_CULMINATED_MESSAGE =
  'Este programa está culminado. La calificación finalizó y no se puede modificar.';

export function normalizeProgramLifecycleFlag(
  value: ProgramLifecycleFlag | string | undefined | null,
): ProgramLifecycleFlag {
  return value === PROGRAM_LIFECYCLE_FLAG.culminated
    ? PROGRAM_LIFECYCLE_FLAG.culminated
    : PROGRAM_LIFECYCLE_FLAG.open;
}

export function isProgramCulminated(
  program: { lifecycleFlag?: ProgramLifecycleFlag } | undefined | null,
): boolean {
  return normalizeProgramLifecycleFlag(program?.lifecycleFlag) === PROGRAM_LIFECYCLE_FLAG.culminated;
}

export function assertProgramWritable(
  program: { lifecycleFlag?: ProgramLifecycleFlag } | undefined | null,
): void {
  if (isProgramCulminated(program)) {
    throw new InvalidAdminCatalogError(PROGRAM_CULMINATED_MESSAGE);
  }
}

export function programLifecycleFlagLabel(flag: ProgramLifecycleFlag): string {
  return flag === PROGRAM_LIFECYCLE_FLAG.culminated ? 'Culminado' : 'Abierto';
}

export function programBoardStatusLabel(program: {
  status: EntityStatus;
  lifecycleFlag?: ProgramLifecycleFlag;
}): string {
  if (isProgramCulminated(program)) return programLifecycleFlagLabel(PROGRAM_LIFECYCLE_FLAG.culminated);
  return statusLabel(program.status);
}

export function expandAutoMissions(code: string, count: number): string[] {
  const raw = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const letter = raw.match(/[A-Z]/)?.[0];
  if (!letter || !Number.isInteger(count) || count < 1) return [];
  const limited = Math.min(count, AUTO_MISSION_COUNT_MAX);
  return Array.from({ length: limited }, (_, index) => `${letter}${index + 1}`);
}

export type CurriculumMissionKind = 'catalog' | 'custom' | 'automatic';

export interface CurriculumMissionRef {
  key: string;
  kind: CurriculumMissionKind;
  value: string;
}

function normalizedMissionToken(value: string): string {
  return encodeURIComponent(value.trim().normalize('NFKC').toLowerCase());
}

export function catalogMissionKey(missionTypeId: string): string {
  return `catalog:${missionTypeId.trim()}`;
}

export function customMissionKey(name: string): string {
  return `custom:${normalizedMissionToken(name)}`;
}

export function automaticMissionKey(label: string): string {
  return `automatic:${label.trim().toUpperCase()}`;
}

export function curriculumMissionRefs(input: {
  missionMode: MissionAssignMode;
  missionTypeIds: readonly string[];
  customMissionNames: readonly string[];
  autoMissionCode: string;
  autoMissionCount: number;
}): CurriculumMissionRef[] {
  if (input.missionMode === 'automatic') {
    return expandAutoMissions(input.autoMissionCode, input.autoMissionCount).map((label) => ({
      key: automaticMissionKey(label),
      kind: 'automatic' as const,
      value: label,
    }));
  }
  const catalog = input.missionTypeIds.filter(Boolean).map((id) => ({
    key: catalogMissionKey(id),
    kind: 'catalog' as const,
    value: id,
  }));
  const custom = input.customMissionNames.map((name) => ({
    key: customMissionKey(name),
    kind: 'custom' as const,
    value: name,
  }));
  return [...catalog, ...custom];
}

function normalizeDirbeLevel(value: unknown): DirbeLevel | undefined {
  return DIRBE_LEVELS.includes(value as DirbeLevel) ? (value as DirbeLevel) : undefined;
}

function normalizeDangerousOutcome(value: unknown): DirbeDangerousOutcome | undefined {
  return DIRBE_DANGEROUS_OUTCOMES.includes(value as DirbeDangerousOutcome)
    ? (value as DirbeDangerousOutcome)
    : undefined;
}

export function emptyDirbePointDeltas(): Record<DirbeLevel, number> {
  return { D: 0, I: 0, R: 0, B: 0, E: 0 };
}

function sanitizeDirbePointMap(value: unknown): Partial<Record<DirbeLevel, number>> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Record<string, unknown>;
  const result: Partial<Record<DirbeLevel, number>> = {};
  for (const level of DIRBE_LEVELS) {
    const num = typeof source[level] === 'number' ? source[level] : Number(source[level]);
    if (Number.isFinite(num) && num !== 0) result[level] = num;
  }
  return Object.keys(result).length ? result : undefined;
}

function splitLegacyDeltas(
  deltas: Partial<Record<DirbeLevel, number>> | undefined,
): {
  adds?: Partial<Record<DirbeLevel, number>>;
  subs?: Partial<Record<DirbeLevel, number>>;
} {
  if (!deltas) return {};
  const adds: Partial<Record<DirbeLevel, number>> = {};
  const subs: Partial<Record<DirbeLevel, number>> = {};
  for (const level of DIRBE_LEVELS) {
    const value = deltas[level];
    if (!value) continue;
    if (value > 0) adds[level] = value;
    if (value < 0) subs[level] = Math.abs(value);
  }
  return {
    ...(Object.keys(adds).length ? { adds } : {}),
    ...(Object.keys(subs).length ? { subs } : {}),
  };
}

function assignmentPolicy(
  item: ManeuverStandardAssignment,
  previous?: ManeuverStandardAssignment,
): Pick<
  ManeuverStandardAssignment,
  | 'dirbePointDeltas'
  | 'dirbePointAdds'
  | 'dirbePointSubs'
  | 'dangerousOutcome'
  | 'dangerousPoints'
  | 'dangerousAdd'
  | 'dangerousSub'
  | 'requiredToAdvance'
  | 'requiredToGrade'
> {
  const dirbePointDeltas = sanitizeDirbePointMap(item.dirbePointDeltas) ?? previous?.dirbePointDeltas;
  const fromLegacy = splitLegacyDeltas(dirbePointDeltas);
  const dirbePointAdds =
    sanitizeDirbePointMap(item.dirbePointAdds) ?? previous?.dirbePointAdds ?? fromLegacy.adds;
  const dirbePointSubs =
    sanitizeDirbePointMap(item.dirbePointSubs) ?? previous?.dirbePointSubs ?? fromLegacy.subs;
  const dangerousOutcome = normalizeDangerousOutcome(item.dangerousOutcome) ?? previous?.dangerousOutcome;
  const dangerousRaw = item.dangerousPoints;
  const dangerousPoints = Number.isFinite(dangerousRaw) ? Number(dangerousRaw) : previous?.dangerousPoints;
  const dangerousAdd = Number.isFinite(item.dangerousAdd) ? Number(item.dangerousAdd) : previous?.dangerousAdd;
  const dangerousSub = Number.isFinite(item.dangerousSub) ? Number(item.dangerousSub) : previous?.dangerousSub;
  const requiredToAdvance = item.requiredToAdvance ?? previous?.requiredToAdvance;
  const requiredToGrade = item.requiredToGrade ?? previous?.requiredToGrade;
  return {
    ...(dirbePointDeltas ? { dirbePointDeltas } : {}),
    ...(dirbePointAdds ? { dirbePointAdds } : {}),
    ...(dirbePointSubs ? { dirbePointSubs } : {}),
    ...(dangerousOutcome ? { dangerousOutcome } : {}),
    ...(typeof dangerousPoints === 'number' ? { dangerousPoints } : {}),
    ...(typeof dangerousAdd === 'number' && dangerousAdd !== 0 ? { dangerousAdd } : {}),
    ...(typeof dangerousSub === 'number' && dangerousSub !== 0 ? { dangerousSub } : {}),
    ...(requiredToAdvance ? { requiredToAdvance: true } : {}),
    ...(requiredToGrade ? { requiredToGrade: true } : {}),
  };
}

function assignmentHasContent(item: ManeuverStandardAssignment): boolean {
  return Boolean(
    item.standardIds.length ||
      item.dirbeLevel ||
      item.dirbePointDeltas ||
      item.dirbePointAdds ||
      item.dirbePointSubs ||
      item.dangerousOutcome ||
      item.dangerousAdd ||
      item.dangerousSub ||
      item.requiredToAdvance ||
      item.requiredToGrade,
  );
}

function sanitizeStandardAssignments(
  assignments: readonly ManeuverStandardAssignment[],
  missionKeys?: ReadonlySet<string>,
  maneuverIds?: ReadonlySet<string>,
): ManeuverStandardAssignment[] {
  const cells = new Map<string, ManeuverStandardAssignment>();
  for (const item of assignments ?? []) {
    const missionKey = item.missionKey?.trim();
    const maneuverId = item.maneuverId?.trim();
    if (!missionKey || !maneuverId) continue;
    if (missionKeys && !missionKeys.has(missionKey)) continue;
    if (maneuverIds && !maneuverIds.has(maneuverId)) continue;
    const standardIds = [...new Set((item.standardIds ?? []).map((id) => id.trim()).filter(Boolean))];
    const dirbeLevel = normalizeDirbeLevel(item.dirbeLevel);
    const previous = cells.get(`${missionKey}\u001f${maneuverId}`);
    const merged: ManeuverStandardAssignment = {
      missionKey,
      maneuverId,
      standardIds: previous ? [...new Set([...previous.standardIds, ...standardIds])] : standardIds,
      ...(dirbeLevel || previous?.dirbeLevel
        ? { dirbeLevel: dirbeLevel ?? previous?.dirbeLevel }
        : {}),
      ...assignmentPolicy(item, previous),
    };
    if (!assignmentHasContent(merged)) continue;
    cells.set(`${missionKey}\u001f${maneuverId}`, merged);
  }
  return [...cells.values()];
}

export function assertProgramStandardMatrixWrite(
  input: ProgramStandardMatrixWriteInput,
): ProgramStandardMatrixWriteInput {
  const subphases = new Map<string, ManeuverStandardAssignment[]>();
  for (const item of input.subphases ?? []) {
    const subphaseId = required(item.subphaseId, 'La subfase de la matriz es obligatoria.');
    const previous = subphases.get(subphaseId) ?? [];
    subphases.set(subphaseId, sanitizeStandardAssignments([...previous, ...(item.assignments ?? [])]));
  }
  return {
    subphases: [...subphases.entries()].map(([subphaseId, assignments]) => ({ subphaseId, assignments })),
  };
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
  const normalizedManeuverIds = [...new Set(input.maneuverIds.filter(Boolean))];
  const normalizedOperationIds = [...new Set((input.maneuverOperationIds ?? []).filter(Boolean))];
  const normalizedMissionTypeIds = missionTypeIds;
  const normalizedCustomNames = missionMode === 'manual' ? customMissionNames : [];
  const normalizedAutoCode = missionMode === 'automatic' ? autoMissionCode : '';
  const normalizedAutoCount = missionMode === 'automatic' ? autoMissionCount : 0;
  const missionKeys = new Set(
    curriculumMissionRefs({
      missionMode,
      missionTypeIds: normalizedMissionTypeIds,
      customMissionNames: normalizedCustomNames,
      autoMissionCode: normalizedAutoCode,
      autoMissionCount: normalizedAutoCount,
    }).map((item) => item.key),
  );
  return {
    subphaseBankId: required(input.subphaseBankId, 'El banco de subfase es obligatorio.'),
    hours: Math.round(hours * 10) / 10,
    missionMode,
    missionTypeIds: normalizedMissionTypeIds,
    customMissionNames: normalizedCustomNames,
    autoMissionCode: normalizedAutoCode,
    autoMissionCount: normalizedAutoCount,
    maneuverIds: normalizedManeuverIds,
    maneuverOperationIds: normalizedOperationIds,
    maneuverAssignment: sanitizeManeuverAssignment(
      input.maneuverAssignment ?? {},
      normalizedManeuverIds,
      normalizedOperationIds,
    ),
    standardAssignments: sanitizeStandardAssignments(
      input.standardAssignments ?? [],
      missionKeys,
      new Set(normalizedManeuverIds),
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

export function defaultProgramModuleKind(phaseBankId: string): ProgramModuleKind {
  const id = phaseBankId.toLowerCase();
  if (id.includes('teo') || id.includes('nit') || id.includes('ground') || id.includes('ctph') || id.includes('ccam')) {
    return 'ground';
  }
  if (id.includes('sim')) return 'simulator';
  return 'air';
}

export function defaultSubphaseModuleKind(
  bank: Pick<SubphaseBankEntity, 'id' | 'code' | 'name' | 'coefficient' | 'minPassingGrade'>,
): ProgramModuleKind {
  if (bank.coefficient !== undefined || bank.minPassingGrade !== undefined) return 'ground';
  const token = `${bank.id} ${bank.code} ${bank.name}`.toLowerCase();
  if (
    token.includes('aula') ||
    token.includes('teo') ||
    token.includes('ctph') ||
    token.includes('ccam') ||
    token.includes('tierra') ||
    token.includes('asignatura') ||
    token.includes('nit')
  ) {
    return 'ground';
  }
  if (token.includes('sim')) return 'simulator';
  return 'air';
}

export function assertProgramModuleKind(value: string | undefined): ProgramModuleKind {
  if (value && (PROGRAM_MODULE_KINDS as readonly string[]).includes(value)) {
    return value as ProgramModuleKind;
  }
  return 'air';
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
    moduleKind: assertProgramModuleKind(input.moduleKind),
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

import { map, Observable } from 'rxjs';
import type { OperationalContext } from '../../domain/entities/operational-context';
import type {
  MissionResult,
  PhaseEntity,
  ProgramType,
  SubphaseEntity,
} from '../../domain/entities/admin-catalog';
import type { AcademicProgramStatus } from '../../domain/entities/academic-record';
import { AcademicRecordAccessError } from '../../domain/errors/domain-error';
import {
  buildAcademicRecord,
  classifyAirGradeSlots,
  type CurriculumPlannerSlot,
} from '../../domain/services/academic-progress';
import {
  airGradeTileStatus,
  airGradeTileTone,
  type AirGradeTileStatus,
  type AirGradeTileTone,
} from '../../domain/services/air-grade-tiles';
import type { AdminCatalogRepository } from '../../ports/admin-catalog.repository';
import { loadAcademicCatalog, type AcademicCatalogSnapshot } from '../academic-catalog.snapshot';
import { assertStudentVisible } from './list-academic-progress';

export interface AirGradeMissionTile {
  code: string;
  missionName: string;
  executionId: string | null;
  assignmentId: string | null;
  average: number | null;
  result: MissionResult | null;
  status: AirGradeTileStatus;
  tone: AirGradeTileTone;
  clickable: boolean;
  needsStudentSignature: boolean;
  instructorName: string | null;
  date: string | null;
  executedHours: number | null;
  aircraftLabel: string | null;
  observations: string;
}

export interface AirGradeSubphaseView {
  id: string;
  name: string;
  completed: boolean;
  average: number | null;
  flownLabel: string;
  tiles: AirGradeMissionTile[];
}

export interface AirGradePhaseView {
  id: string;
  name: string;
  description: string;
  totalMissions: number;
  evaluatedCount: number;
  completed: boolean;
  hoursFlown: number;
  hoursPlanned: number;
  subphases: AirGradeSubphaseView[];
}

export interface AirGradeProgramView {
  programId: string;
  programName: string;
  programCode: string;
  programType: ProgramType;
  description: string;
  imageUrl: string;
  academicStatus: AcademicProgramStatus;
  academicYear: number | null;
  promotionName: string | null;
  squadronName: string | null;
  percentComplete: number;
  average: number | null;
  accumulatedHours: number;
  plannedHours: number;
  remainingHours: number;
  completedMissions: number;
  pendingMissions: number;
  approvedMissions: number;
  failedMissions: number;
  phases: AirGradePhaseView[];
}

export interface AirGradeBoard {
  userId: string;
  displayName: string;
  indicative: string | null;
  specialtyNames: string[];
  active: boolean;
  programs: AirGradeProgramView[];
  spotlight: AirGradeMissionTile | null;
}

function personName(
  userId: string | null,
  snapshot: AcademicCatalogSnapshot,
): string | null {
  if (!userId) return null;
  const user = snapshot.users.find((item) => item.id === userId);
  return user ? `${user.firstName} ${user.lastName}`.trim() : null;
}

function roundAverage(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
}

function aircraftLabel(aircraftId: string | null, snapshot: AcademicCatalogSnapshot): string | null {
  if (!aircraftId) return null;
  const aircraft = snapshot.aircraft.find((item) => item.id === aircraftId);
  return aircraft?.registration ?? aircraftId;
}

function missionName(refValue: string, snapshot: AcademicCatalogSnapshot): string {
  return snapshot.missionTypes.find((item) => item.id === refValue)?.name ?? refValue;
}

function isAirPhase(phase: PhaseEntity | undefined): boolean {
  return phase?.moduleKind === 'air';
}

function slotCompleted(item: CurriculumPlannerSlot): boolean {
  if (item.execution?.status === 'completed') return true;
  return item.assignment?.status === 'completed';
}

function buildTile(
  item: CurriculumPlannerSlot,
  index: number,
  snapshot: AcademicCatalogSnapshot,
): AirGradeMissionTile {
  const execution = item.execution;
  const status = airGradeTileStatus({ average: item.average, result: execution?.result ?? null });
  return {
    code: `M${index + 1}`,
    missionName: missionName(item.slot.ref.value, snapshot),
    executionId: execution?.id ?? null,
    assignmentId: item.assignment?.id ?? null,
    average: item.average,
    result: execution?.result ?? null,
    status,
    tone: airGradeTileTone(status),
    clickable: !!execution?.id,
    needsStudentSignature: !!execution && !execution.studentSignature,
    instructorName: personName(item.assignment?.instructorId ?? null, snapshot),
    date: execution?.startDate ?? item.assignment?.date ?? null,
    executedHours: execution?.executedHours ?? null,
    aircraftLabel: aircraftLabel(execution?.aircraftId ?? null, snapshot),
    observations: execution?.observations ?? '',
  };
}

function buildSubphase(
  subphase: SubphaseEntity,
  items: readonly CurriculumPlannerSlot[],
  snapshot: AcademicCatalogSnapshot,
): AirGradeSubphaseView {
  const tiles = items.map((item, index) => buildTile(item, index, snapshot));
  const averages = tiles.map((tile) => tile.average).filter((value): value is number => value !== null);
  const done = items.filter((item) => slotCompleted(item)).length;
  const bank = snapshot.subphaseBanks.find((entry) => entry.id === subphase.subphaseBankId);
  return {
    id: subphase.id,
    name: bank?.name ?? subphase.id,
    completed: items.length > 0 && done === items.length,
    average: roundAverage(averages),
    flownLabel: items.length === 0 ? '0%' : `${Math.round((done / items.length) * 100)}%`,
    tiles,
  };
}

function buildPhase(
  phase: PhaseEntity,
  items: readonly CurriculumPlannerSlot[],
  snapshot: AcademicCatalogSnapshot,
): AirGradePhaseView {
  const bank = snapshot.phaseBanks.find((entry) => entry.id === phase.phaseBankId);
  const subphases = snapshot.subphases
    .filter((item) => item.phaseId === phase.id)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const views = subphases
    .map((subphase) =>
      buildSubphase(
        subphase,
        items.filter((item) => item.slot.subphaseId === subphase.id),
        snapshot,
      ),
    )
    .filter((view) => view.tiles.length > 0);
  const evaluatedCount = views.reduce(
    (total, view) => total + view.tiles.filter((tile) => tile.average !== null || tile.result).length,
    0,
  );
  const totalMissions = views.reduce((total, view) => total + view.tiles.length, 0);
  const hoursPlanned = subphases.reduce((total, item) => total + item.hours, 0);
  const hoursFlown = items.reduce((total, item) => total + (item.execution?.executedHours ?? 0), 0);
  return {
    id: phase.id,
    name: bank?.name ?? phase.id,
    description: bank?.description ?? '',
    totalMissions,
    evaluatedCount,
    completed: views.length > 0 && views.every((view) => view.completed),
    hoursFlown: Math.round(hoursFlown * 10) / 10,
    hoursPlanned: Math.round(hoursPlanned * 10) / 10,
    subphases: views,
  };
}

export function buildAirGradeBoard(snapshot: AcademicCatalogSnapshot, userId: string): AirGradeBoard {
  const user = snapshot.users.find((item) => item.id === userId);
  if (!user) throw new AcademicRecordAccessError();
  const { progress, record } = buildAcademicRecord({
    user,
    programs: snapshot.programs,
    phases: snapshot.phases,
    subphases: snapshot.subphases,
    assignments: snapshot.assignments,
    executions: snapshot.executions,
    enrollments: snapshot.enrollments,
  });
  const programs: AirGradeProgramView[] = [];
  for (const programRecord of record.programs) {
    const program = snapshot.programs.find((item) => item.id === programRecord.programId);
    if (!program) continue;
    const airPhases = snapshot.phases
      .filter((phase) => phase.programId === program.id && isAirPhase(phase))
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (airPhases.length === 0) continue;
    const items = classifyAirGradeSlots(userId, program.id, snapshot);
    const phases = airPhases
      .map((phase) => buildPhase(phase, items.filter((item) => item.slot.phaseId === phase.id), snapshot))
      .filter((phase) => phase.subphases.length > 0);
    if (phases.length === 0) continue;
    const tiles = phases.flatMap((phase) => phase.subphases.flatMap((subphase) => subphase.tiles));
    const evaluated = tiles.filter((tile) => tile.average !== null || tile.result);
    const completed = tiles.filter((tile) => tile.clickable && tile.status !== 'pending').length;
    const hoursFlown = phases.reduce((total, phase) => total + phase.hoursFlown, 0);
    const hoursPlanned = phases.reduce((total, phase) => total + phase.hoursPlanned, 0);
    const enrollment = snapshot.enrollments.find(
      (item) => item.userId === userId && item.programId === program.id,
    );
    const promotion = enrollment?.promotionId
      ? snapshot.promotions.find((item) => item.id === enrollment.promotionId)
      : undefined;
    const squadron = user.assignedSquadronId
      ? snapshot.squadrons.find((item) => item.id === user.assignedSquadronId)
      : undefined;
    programs.push({
      programId: program.id,
      programName: program.name,
      programCode: program.code,
      programType: program.programType,
      description: program.description,
      imageUrl: program.imageUrl,
      academicStatus: programRecord.status,
      academicYear: program.academicYear ?? null,
      promotionName: promotion?.name ?? null,
      squadronName: squadron?.name ?? null,
      percentComplete: tiles.length === 0 ? 0 : Math.round((completed / tiles.length) * 100),
      average: roundAverage(evaluated.map((tile) => tile.average).filter((value): value is number => value !== null)),
      accumulatedHours: Math.round(hoursFlown * 10) / 10,
      plannedHours: Math.round(hoursPlanned * 10) / 10,
      remainingHours: Math.max(0, Math.round((hoursPlanned - hoursFlown) * 10) / 10),
      completedMissions: completed,
      pendingMissions: tiles.length - completed,
      approvedMissions: tiles.filter((tile) => tile.result === 'approved' || tile.result === 'approved-observations').length,
      failedMissions: tiles.filter((tile) => tile.result === 'failed').length,
      phases,
    });
  }
  if (progress) {
    const current = programs.find((item) => item.programId === progress.programId);
    if (current) {
      programs.splice(programs.indexOf(current), 1);
      programs.unshift(current);
    }
  }
  const spotlightTiles = programs.flatMap((program) =>
    program.phases.flatMap((phase) => phase.subphases.flatMap((subphase) => subphase.tiles)),
  );
  const spotlight =
    spotlightTiles.find((tile) => tile.needsStudentSignature) ??
    spotlightTiles.find((tile) => tile.status === 'insufficient' || tile.status === 'observed') ??
    spotlightTiles.find((tile) => tile.clickable) ??
    null;
  return {
    userId,
    displayName: `${user.firstName} ${user.lastName}`.trim(),
    indicative: user.indicative,
    specialtyNames: user.specialtyIds
      .map((id) => snapshot.specialties.find((item) => item.id === id)?.name ?? null)
      .filter((name): name is string => !!name),
    active: user.status === 'active',
    programs,
    spotlight,
  };
}

export const AIR_GRADE_DEMO_STUDENT_ID = 'usr-sofia-vidal';

export function resolveAirGradeStudentId(rawUserId: string, snapshot: AcademicCatalogSnapshot): string {
  const cleaned = rawUserId.split('?')[0]?.trim() ?? '';
  if (cleaned && snapshot.users.some((item) => item.id === cleaned)) return cleaned;
  return AIR_GRADE_DEMO_STUDENT_ID;
}

export function airGradeBoardForViewer(
  snapshot: AcademicCatalogSnapshot,
  context: OperationalContext,
  rawUserId: string,
): AirGradeBoard {
  const resolved = resolveAirGradeStudentId(rawUserId, snapshot);
  try {
    if (resolved !== context.userId) {
      assertStudentVisible(context, resolved, snapshot);
    }
  } catch {
    return buildAirGradeBoard(snapshot, AIR_GRADE_DEMO_STUDENT_ID);
  }
  const board = buildAirGradeBoard(snapshot, resolved);
  if (board.programs.length > 0) return board;
  return buildAirGradeBoard(snapshot, AIR_GRADE_DEMO_STUDENT_ID);
}

export class GetAirGradeBoard {
  constructor(private readonly catalog: AdminCatalogRepository) {}

  execute(context: OperationalContext, userId: string): Observable<AirGradeBoard> {
    return loadAcademicCatalog(this.catalog).pipe(
      map((snapshot) => airGradeBoardForViewer(snapshot, context, userId)),
    );
  }
}

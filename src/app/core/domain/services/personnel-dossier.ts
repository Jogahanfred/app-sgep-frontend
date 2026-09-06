import type {
  AircraftEntity,
  IndividualMissionAssignmentEntity,
  MissionExecutionEntity,
  MissionResult,
  MissionTypeEntity,
  PhaseBankEntity,
  SquadronEntity,
  SubphaseBankEntity,
  UnitEntity,
  UserEntity,
} from '../entities/admin-catalog';
import type { AcademicProgramStatus } from '../entities/academic-record';
import { missionManeuverAverage } from './mission-execution-grade';
import {
  buildAcademicRecord,
  classifyCurriculumPlannerSlots,
  plannedSlotsForProgram,
  type AcademicProgressSources,
} from './academic-progress';

export interface DossierHoursBreakdown {
  total: number;
  dual: number;
  night: number;
  ifr: number;
}

export interface DossierMissionLogRow {
  executionId: string;
  date: string;
  window: string;
  missionCode: string;
  missionName: string;
  aircraft: string;
  instructorName: string;
  hours: number;
  score: number | null;
  result: MissionResult | null;
  signed: boolean;
}

export interface DossierLicense {
  id: string;
  title: string;
  status: 'current' | 'approved' | 'pending';
  detail: string;
  expires: string;
}

export interface DossierResolution {
  id: string;
  kind: 'recognition' | 'check' | 'counsel' | 'closed';
  date: string;
  title: string;
  summary: string;
}

export interface DossierTrajectoryPoint {
  label: string;
  score: number;
}

export interface DossierProgramCard {
  programId: string;
  name: string;
  code: string;
  imageUrl: string;
  description: string;
  status: AcademicProgramStatus;
  percentComplete: number;
  average: number | null;
  hours: number;
}

export interface DossierCurriculumMission {
  key: string;
  code: string;
  score: number | null;
  evaluated: boolean;
}

export interface DossierCurriculumSubphase {
  id: string;
  indexLabel: string;
  name: string;
  average: number | null;
  percentFlown: number;
  completed: boolean;
  missions: DossierCurriculumMission[];
}

export interface DossierCurriculumPhase {
  id: string;
  indexLabel: string;
  name: string;
  description: string;
  missionCount: number;
  evaluatedCount: number;
  accredited: boolean;
  subphases: DossierCurriculumSubphase[];
}

export interface DossierCurriculum {
  programId: string;
  programName: string;
  programCode: string;
  imageUrl: string;
  description: string;
  phases: DossierCurriculumPhase[];
}

export function isNightFlightTime(time: string): boolean {
  const match = time.trim().match(/^(\d{1,2}):/);
  if (!match) return false;
  return Number(match[1]) >= 18;
}

export function studentMissionExecutions(
  studentId: string,
  assignments: readonly IndividualMissionAssignmentEntity[],
  executions: readonly MissionExecutionEntity[],
): Array<{ assignment: IndividualMissionAssignmentEntity; execution: MissionExecutionEntity }> {
  const byAssignment = new Map(executions.map((item) => [item.individualAssignmentId, item]));
  return assignments
    .filter((item) => item.studentId === studentId)
    .map((assignment) => {
      const execution = byAssignment.get(assignment.id);
      return execution ? { assignment, execution } : null;
    })
    .filter((item): item is { assignment: IndividualMissionAssignmentEntity; execution: MissionExecutionEntity } => !!item)
    .sort((left, right) => `${right.assignment.date} ${right.execution.takeoffTime}`.localeCompare(`${left.assignment.date} ${left.execution.takeoffTime}`));
}

export function dossierHoursBreakdown(
  rows: ReadonlyArray<{ assignment: IndividualMissionAssignmentEntity; execution: MissionExecutionEntity }>,
  missions: readonly MissionTypeEntity[],
): DossierHoursBreakdown {
  let total = 0;
  let dual = 0;
  let night = 0;
  let ifr = 0;
  for (const row of rows) {
    if (row.execution.status !== 'completed') continue;
    const hours = row.execution.executedHours || 0;
    total += hours;
    if (row.assignment.instructorId) dual += hours;
    if (isNightFlightTime(row.execution.takeoffTime || row.execution.startTime || '')) night += hours;
    const mission = missions.find((item) => item.id === row.assignment.missionId);
    const haystack = `${mission?.code ?? ''} ${mission?.name ?? ''}`.toLowerCase();
    if (haystack.includes('ifr') || haystack.includes('instrumento')) ifr += hours;
  }
  return {
    total: roundHours(total),
    dual: roundHours(dual),
    night: roundHours(night),
    ifr: roundHours(ifr),
  };
}

export function dossierMissionLog(
  rows: ReadonlyArray<{ assignment: IndividualMissionAssignmentEntity; execution: MissionExecutionEntity }>,
  missions: readonly MissionTypeEntity[],
  aircraft: readonly AircraftEntity[],
  users: readonly UserEntity[],
): DossierMissionLogRow[] {
  return rows
    .filter((row) => row.execution.status === 'completed')
    .map((row) => {
      const mission = missions.find((item) => item.id === row.assignment.missionId);
      const plane = aircraft.find((item) => item.id === row.execution.aircraftId);
      const instructor = users.find((item) => item.id === row.assignment.instructorId);
      return {
        executionId: row.execution.id,
        date: row.assignment.date,
        window: [row.execution.takeoffTime, row.execution.landingTime].filter(Boolean).join(' - '),
        missionCode: mission?.code ?? row.assignment.missionId,
        missionName: mission?.name ?? row.assignment.missionId,
        aircraft: plane?.registration ?? '—',
        instructorName: instructor ? `${instructor.firstName} ${instructor.lastName}`.trim() : '—',
        hours: roundHours(row.execution.executedHours || 0),
        score: missionManeuverAverage(row.execution.evaluations.map((item) => item.grade)),
        result: row.execution.result,
        signed: !!row.execution.instructorSignature,
      };
    });
}

export function dossierTrajectory(
  log: readonly DossierMissionLogRow[],
): DossierTrajectoryPoint[] {
  return [...log]
    .reverse()
    .filter((row) => row.score !== null)
    .slice(-8)
    .map((row) => ({
      label: row.missionCode,
      score: row.score ?? 0,
    }));
}

export function dossierLicenses(params: {
  programName: string | null;
  academicStatus: string | null;
  userStatus: UserEntity['status'];
  hours: DossierHoursBreakdown;
}): DossierLicense[] {
  const program = params.programName ?? 'Programa actual';
  return [
    {
      id: 'lic-program',
      title: program,
      status: params.academicStatus === 'completed' ? 'approved' : 'current',
      detail: params.academicStatus === 'completed' ? 'Programa culminado' : 'Matrícula vigente',
      expires: params.academicStatus === 'completed' ? 'Permanente' : 'En curso',
    },
    {
      id: 'lic-status',
      title: 'Estado de alumno',
      status: params.userStatus === 'active' ? 'current' : 'pending',
      detail: params.userStatus === 'active' ? 'Activo en catálogo' : 'Inactivo',
      expires: '—',
    },
    {
      id: 'lic-ifr',
      title: 'Horas por instrumentos',
      status: params.hours.ifr > 0 ? 'current' : 'pending',
      detail: params.hours.ifr > 0 ? `${params.hours.ifr} h registradas` : 'Sin horas IFR en bitácora',
      expires: 'Según bitácora',
    },
    {
      id: 'lic-night',
      title: 'Horas nocturnas',
      status: params.hours.night > 0 ? 'current' : 'pending',
      detail: params.hours.night > 0 ? `${params.hours.night} h después de las 18:00` : 'Sin horas nocturnas',
      expires: 'Según bitácora',
    },
  ];
}

export function dossierResolutions(
  rows: ReadonlyArray<{ assignment: IndividualMissionAssignmentEntity; execution: MissionExecutionEntity }>,
  missions: readonly MissionTypeEntity[],
  programCompleted: boolean,
  programName: string | null,
): DossierResolution[] {
  const items: DossierResolution[] = [];
  if (programCompleted && programName) {
    items.push({
      id: 'res-complete',
      kind: 'recognition',
      date: latestCompletedDate(rows) ?? '',
      title: 'Culminación de programa',
      summary: `Registro de cierre académico de ${programName}.`,
    });
  }
  for (const row of rows) {
    if (!row.execution.counselRequested) continue;
    const mission = missions.find((item) => item.id === row.assignment.missionId);
    items.push({
      id: `res-counsel-${row.execution.id}`,
      kind: 'counsel',
      date: row.assignment.date,
      title: 'Solicitud de consejo',
      summary: `Quedó marcada la solicitud de consejo en ${mission?.code ?? 'la misión'}.`,
    });
  }
  return items.slice(0, 6);
}

export function unitAndSquadronLabel(
  user: UserEntity,
  units: readonly UnitEntity[],
  squadrons: readonly SquadronEntity[],
): { unitName: string; squadronName: string } {
  return {
    unitName: units.find((item) => item.id === user.assignedUnitId)?.name ?? '—',
    squadronName: squadrons.find((item) => item.id === user.assignedSquadronId)?.name ?? '—',
  };
}

function latestCompletedDate(
  rows: ReadonlyArray<{ assignment: IndividualMissionAssignmentEntity; execution: MissionExecutionEntity }>,
): string | null {
  const completed = rows.filter((row) => row.execution.status === 'completed');
  return completed[0]?.assignment.date ?? null;
}

function roundHours(value: number): number {
  return Math.round(value * 10) / 10;
}

const CARD_BLOOD_TYPES = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'] as const;
const CARD_EXPIRY_YEARS = 4;

export function dossierCardBloodType(userId: string): string {
  let hash = 0;
  for (const char of userId) hash = (hash + char.charCodeAt(0)) % CARD_BLOOD_TYPES.length;
  return CARD_BLOOD_TYPES[hash];
}

export function dossierCardSerial(documentNumber: string, bloodType: string): string {
  const digits = documentNumber.replace(/\D/g, '').padStart(5, '0').slice(-5);
  return `O-${digits}-${bloodType}`;
}

export function dossierCardExpiry(entryDate: string): string {
  const [year, month, day] = entryDate.split('-').map(Number);
  if (!year || !month || !day) return '';
  const expiry = new Date(Date.UTC(year + CARD_EXPIRY_YEARS, month - 1, day));
  const dd = String(expiry.getUTCDate()).padStart(2, '0');
  const mm = String(expiry.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${expiry.getUTCFullYear()}`;
}

export function dossierProgramCards(sources: AcademicProgressSources): DossierProgramCard[] {
  const built = buildAcademicRecord(sources);
  return built.record.programs
    .map((record) => {
      const program = sources.programs.find((item) => item.id === record.programId);
      if (!program) return null;
      const planned = plannedSlotsForProgram(program.id, sources.phases, sources.subphases).length;
      const percentComplete = planned ? Math.round((record.executedMissionIds.length / planned) * 100) : 0;
      return {
        programId: program.id,
        name: program.name,
        code: program.code,
        imageUrl: program.imageUrl,
        description: program.description,
        status: record.status,
        percentComplete,
        average: record.average,
        hours: record.accumulatedHours,
      };
    })
    .filter((item): item is DossierProgramCard => !!item);
}

export function buildDossierCurriculum(
  userId: string,
  programId: string,
  sources: AcademicProgressSources & {
    phaseBanks: readonly PhaseBankEntity[];
    subphaseBanks: readonly SubphaseBankEntity[];
    missionTypes: readonly MissionTypeEntity[];
  },
): DossierCurriculum | null {
  const program = sources.programs.find((item) => item.id === programId);
  if (!program) return null;
  const slots = classifyCurriculumPlannerSlots(userId, programId, sources);
  const phases = sources.phases
    .filter((phase) => phase.programId === programId)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const phaseViews: DossierCurriculumPhase[] = phases.map((phase, phaseIndex) => {
    const bank = sources.phaseBanks.find((item) => item.id === phase.phaseBankId);
    const subphases = sources.subphases
      .filter((item) => item.phaseId === phase.id)
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder);
    const subphaseViews: DossierCurriculumSubphase[] = subphases.map((subphase, subIndex) => {
      const subBank = sources.subphaseBanks.find((item) => item.id === subphase.subphaseBankId);
      const missionSlots = slots.filter((item) => item.slot.subphaseId === subphase.id);
      const missions: DossierCurriculumMission[] = missionSlots.map((item) => {
        const evaluated = item.average !== null || item.status === 'completed';
        return {
          key: item.slot.ref.key,
          code: missionCode(item.slot.ref.value, item.slot.ref.kind, sources.missionTypes),
          score: item.average,
          evaluated,
        };
      });
      const scored = missions.filter((item) => item.score !== null).map((item) => item.score as number);
      const flown = missions.filter((item) => item.evaluated).length;
      const percentFlown = missions.length ? Math.round((flown / missions.length) * 100) : 0;
      return {
        id: subphase.id,
        indexLabel: `${phaseIndex + 1}.${subIndex + 1}`,
        name: subBank?.name ?? subphase.id,
        average: scored.length ? Math.round((scored.reduce((sum, value) => sum + value, 0) / scored.length) * 10) / 10 : null,
        percentFlown,
        completed: missions.length > 0 && flown >= missions.length,
        missions,
      };
    });
    const missionCount = subphaseViews.reduce((sum, item) => sum + item.missions.length, 0);
    const evaluatedCount = subphaseViews.reduce(
      (sum, item) => sum + item.missions.filter((mission) => mission.evaluated).length,
      0,
    );
    return {
      id: phase.id,
      indexLabel: `${phaseIndex + 1}`,
      name: bank?.name ?? phase.id,
      description: bank?.description ?? '',
      missionCount,
      evaluatedCount,
      accredited: missionCount > 0 && evaluatedCount >= missionCount,
      subphases: subphaseViews,
    };
  });
  return {
    programId: program.id,
    programName: program.name,
    programCode: program.code,
    imageUrl: program.imageUrl,
    description: program.description,
    phases: phaseViews,
  };
}

function missionCode(value: string, kind: string, missions: readonly MissionTypeEntity[]): string {
  if (kind === 'catalog') {
    return missions.find((item) => item.id === value)?.code ?? value;
  }
  return value;
}

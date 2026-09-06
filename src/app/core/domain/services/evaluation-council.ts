import {
  EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD,
  EVALUATION_COUNCIL_MEMBER_USER_IDS,
  type EvaluationCouncilResolutionOption,
} from '../constants/evaluation-council.constants';
import type {
  IndividualMissionAssignmentEntity,
  MissionExecutionEntity,
  MissionTypeEntity,
  UserEntity,
  UserRoleEntity,
} from '../entities/admin-catalog';
import { missionManeuverAverage } from './mission-execution-grade';
import { studentMissionExecutions } from './personnel-dossier';

export interface CouncilFailedFlight {
  executionId: string;
  date: string;
  score: number | null;
  missionCode: string;
  missionName: string;
  instructorName: string;
  hours: number;
  observations: string;
  critical: boolean;
}

export interface CouncilMember {
  userId: string;
  seat: 'president' | 'vocal-ops' | 'vocal-instruction' | 'vocal-safety' | 'secretary';
  displayName: string;
  roleName: string;
  signed: boolean;
}

export interface CouncilVote {
  userId: string;
  option: EvaluationCouncilResolutionOption;
  rationale: string;
  signedAt: string;
}

export function failedMissionCount(
  studentId: string,
  assignments: readonly IndividualMissionAssignmentEntity[],
  executions: readonly MissionExecutionEntity[],
): number {
  return studentMissionExecutions(studentId, assignments, executions).filter(
    (row) => row.execution.result === 'failed',
  ).length;
}

export function exceedsEvaluationCouncilThreshold(failedCount: number): boolean {
  return failedCount >= EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD;
}

export function councilFailedFlights(
  studentId: string,
  assignments: readonly IndividualMissionAssignmentEntity[],
  executions: readonly MissionExecutionEntity[],
  missions: readonly MissionTypeEntity[],
  users: readonly UserEntity[],
): CouncilFailedFlight[] {
  return studentMissionExecutions(studentId, assignments, executions)
    .filter((row) => row.execution.result === 'failed')
    .map((row, index, all) => {
      const mission = missions.find((item) => item.id === row.assignment.missionId);
      const instructor = users.find((item) => item.id === row.assignment.instructorId);
      const score = missionManeuverAverage(row.execution.evaluations.map((item) => item.grade));
      return {
        executionId: row.execution.id,
        date: row.assignment.date,
        score,
        missionCode: mission?.code ?? row.assignment.missionId,
        missionName: mission?.name ?? row.assignment.missionId,
        instructorName: instructor ? `${instructor.firstName} ${instructor.lastName}`.trim() : '—',
        hours: Math.round((row.execution.executedHours || 0) * 10) / 10,
        observations: row.execution.observations || row.execution.improvements || row.execution.recommendations,
        critical: index === 0 && all.length >= EVALUATION_COUNCIL_FAILED_MISSION_THRESHOLD,
      };
    });
}

export function councilMembers(users: readonly UserEntity[], roles: readonly UserRoleEntity[]): CouncilMember[] {
  const seats: Array<CouncilMember['seat']> = [
    'president',
    'vocal-ops',
    'vocal-instruction',
    'vocal-safety',
    'secretary',
  ];
  const ids = [
    EVALUATION_COUNCIL_MEMBER_USER_IDS.president,
    EVALUATION_COUNCIL_MEMBER_USER_IDS.vocalOps,
    EVALUATION_COUNCIL_MEMBER_USER_IDS.vocalInstruction,
    EVALUATION_COUNCIL_MEMBER_USER_IDS.vocalSafety,
    EVALUATION_COUNCIL_MEMBER_USER_IDS.secretary,
  ];
  return seats.map((seat, index) => {
    const user = users.find((item) => item.id === ids[index]);
    const role = roles.find((item) => item.id === user?.roleIds[0]);
    return {
      userId: user?.id ?? ids[index]!,
      seat,
      displayName: user ? `${user.firstName} ${user.lastName}`.trim() : ids[index]!,
      roleName: role?.name ?? '',
      signed: true,
    };
  });
}

export function councilAverage(flights: readonly CouncilFailedFlight[]): number | null {
  const scores = flights.map((item) => item.score).filter((item): item is number => item !== null);
  if (!scores.length) return null;
  return Math.round((scores.reduce((total, value) => total + value, 0) / scores.length) * 100) / 100;
}

export function defaultCouncilVotes(members: readonly CouncilMember[]): CouncilVote[] {
  return members.map((member, index) => ({
    userId: member.userId,
    option: member.seat === 'secretary' ? 'reinforcement' : 'reclassify',
    rationale:
      member.seat === 'secretary'
        ? 'Voto en minoría: propone un paquete limitado de refuerzo antes de la baja de especialidad.'
        : index === 0
          ? 'La reiteración de reprobaciones supera el tope y compromete la seguridad operacional.'
          : 'Coincide con el dictamen de inseguridad operacional por acumulación de fallas.',
    signedAt: '14:20',
  }));
}

import type {
  GroupMissionAssignmentEntity,
  IndividualMissionAssignmentEntity,
  MissionExecutionEntity,
  ProgramEnrollmentEntity,
} from '../../domain/entities/admin-catalog';
import { curriculumMissionRefs } from '../../domain/services/admin-catalog';
import {
  HELICOPTER_PHASES,
  HELICOPTER_PROGRAMS,
  HELICOPTER_SUBPHASES,
  helicopterCoreGroundCourseIds,
} from './helicopter-program.data';

export {
  HELICOPTER_MANEUVERS,
  HELICOPTER_MISSION_TYPES,
  HELICOPTER_OPERATIONS,
  HELICOPTER_PHASE_BANKS,
  HELICOPTER_PHASES,
  HELICOPTER_PROGRAMS,
  HELICOPTER_SOURCE_SUMMARY,
  HELICOPTER_SUBPHASE_BANKS,
  HELICOPTER_SUBPHASES,
} from './helicopter-program.data';

export const HELICOPTER_COURSE_ID = HELICOPTER_PROGRAMS[0]?.id ?? 'prg-heli-2023';
export const HELICOPTER_COURSE_PROMOTION_ID = 'promotion-2025-alfa';
export const HELICOPTER_COURSE_INSTRUCTORS = ['usr-pablo-nunez', 'usr-carmen-lopez'] as const;

function isoDate(start: string, offsetDays: number): string {
  const date = new Date(`${start}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function helicopterMissionSlots(): string[] {
  const phaseIds = HELICOPTER_PHASES.slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((phase) => phase.id);
  return HELICOPTER_SUBPHASES.filter((item) => phaseIds.includes(item.phaseId))
    .slice()
    .sort((a, b) => {
      const phaseA = phaseIds.indexOf(a.phaseId);
      const phaseB = phaseIds.indexOf(b.phaseId);
      if (phaseA !== phaseB) return phaseA - phaseB;
      return a.sortOrder - b.sortOrder;
    })
    .flatMap((subphase) => curriculumMissionRefs(subphase).map((ref) => ref.value));
}

function seedHelicopterTrack(input: {
  prefix: string;
  studentId: string;
  startDate: string;
  completeCount: number;
  gradePattern: 'excellent' | 'high' | 'solid';
  failFrom?: number;
}): { assignments: IndividualMissionAssignmentEntity[]; executions: MissionExecutionEntity[] } {
  const missions = helicopterMissionSlots().slice(0, input.completeCount);
  const assignments: IndividualMissionAssignmentEntity[] = [];
  const executions: MissionExecutionEntity[] = [];
  missions.forEach((missionId, index) => {
    const assignmentId = `${input.prefix}-as-${String(index + 1).padStart(3, '0')}`;
    const executionId = `${input.prefix}-ex-${String(index + 1).padStart(3, '0')}`;
    const date = isoDate(input.startDate, index);
    const instructorId = HELICOPTER_COURSE_INSTRUCTORS[index % HELICOPTER_COURSE_INSTRUCTORS.length] ?? HELICOPTER_COURSE_INSTRUCTORS[0];
    const failed = input.failFrom !== undefined && index >= input.failFrom;
    const grade = failed
      ? 'I'
      : input.gradePattern === 'excellent'
        ? 'E'
        : input.gradePattern === 'high'
          ? index % 5 === 0
            ? 'B'
            : 'E'
          : index % 3 === 0
            ? 'E'
            : 'B';
    assignments.push({
      id: assignmentId,
      assignmentCase: 'pdi',
      studentId: input.studentId,
      externalPerson: null,
      programId: HELICOPTER_COURSE_ID,
      missionId,
      instructorId,
      date,
      status: 'completed',
    });
    executions.push({
      id: executionId,
      individualAssignmentId: assignmentId,
      status: 'completed',
      startDate: date,
      startTime: '08:00',
      takeoffTime: '08:10',
      landingTime: '09:20',
      executedHours: 1.2,
      aircraftId: 'ac-hva',
      observations: '',
      strengths: '',
      improvements: '',
      recommendations: '',
      result: failed ? 'failed' : 'approved',
      evaluations: [{ id: `${executionId}-ev`, maneuverId: 'man-toff', grade, observation: '', evidenceName: null }],
    });
  });
  return { assignments, executions };
}

function promotionEnrollment(id: string, userId: string): ProgramEnrollmentEntity {
  return {
    id,
    programId: HELICOPTER_COURSE_ID,
    userId,
    promotionId: HELICOPTER_COURSE_PROMOTION_ID,
    source: 'promotion',
    enrolledAt: '2025-01-13',
    status: 'active',
    closedAt: null,
    closeReason: null,
    groundCourseIds: helicopterCoreGroundCourseIds(),
  };
}

function individualEnrollment(id: string, userId: string, enrolledAt: string): ProgramEnrollmentEntity {
  return {
    id,
    programId: HELICOPTER_COURSE_ID,
    userId,
    promotionId: null,
    source: 'individual',
    enrolledAt,
    status: 'active',
    closedAt: null,
    closeReason: null,
    groundCourseIds: helicopterCoreGroundCourseIds(),
  };
}

const slots = helicopterMissionSlots();
const failCount = Math.max(12, Math.round(slots.length * 0.22));
const failFrom = Math.max(1, failCount - 3);
const nataliaCount = Math.max(10, Math.round(slots.length * 0.38));
const silviaCount = Math.max(8, Math.round(slots.length * 0.32));
const sofia = seedHelicopterTrack({
  prefix: 'sofia-heli',
  studentId: 'usr-sofia-vidal',
  startDate: '2025-01-13',
  completeCount: slots.length,
  gradePattern: 'excellent',
});
const alba = seedHelicopterTrack({
  prefix: 'alba-heli',
  studentId: 'usr-alba-ferrer-sol',
  startDate: '2025-01-13',
  completeCount: slots.length,
  gradePattern: 'high',
});
const hugo = seedHelicopterTrack({
  prefix: 'hugo-heli',
  studentId: 'usr-hugo-pardo-leon',
  startDate: '2025-01-13',
  completeCount: slots.length,
  gradePattern: 'solid',
});
const diego = seedHelicopterTrack({
  prefix: 'diego-heli',
  studentId: 'usr-diego-molina',
  startDate: '2025-01-20',
  completeCount: failCount,
  gradePattern: 'solid',
  failFrom,
});
const nuria = seedHelicopterTrack({
  prefix: 'nuria-heli',
  studentId: 'usr-nuria-beltran-cid',
  startDate: '2025-01-20',
  completeCount: failCount,
  gradePattern: 'solid',
  failFrom,
});
const oscar = seedHelicopterTrack({
  prefix: 'oscar-heli',
  studentId: 'usr-oscar-mendez-rivas',
  startDate: '2025-01-20',
  completeCount: failCount,
  gradePattern: 'solid',
  failFrom,
});
const natalia = seedHelicopterTrack({
  prefix: 'natalia-heli',
  studentId: 'usr-natalia-rey-cubero',
  startDate: '2025-03-10',
  completeCount: nataliaCount,
  gradePattern: 'high',
});
const silvia = seedHelicopterTrack({
  prefix: 'silvia-heli',
  studentId: 'usr-silvia-rueda-paz',
  startDate: '2025-03-03',
  completeCount: silviaCount,
  gradePattern: 'solid',
});
const silviaNext = slots[silviaCount];
const silviaOpenDate = isoDate('2025-03-03', silviaCount);

export const HELICOPTER_COURSE_ENROLLMENTS: ProgramEnrollmentEntity[] = [
  promotionEnrollment('enrollment-sofia-heli', 'usr-sofia-vidal'),
  promotionEnrollment('enrollment-alba-heli', 'usr-alba-ferrer-sol'),
  promotionEnrollment('enrollment-hugo-heli', 'usr-hugo-pardo-leon'),
  promotionEnrollment('enrollment-diego-heli', 'usr-diego-molina'),
  promotionEnrollment('enrollment-nuria-heli', 'usr-nuria-beltran-cid'),
  promotionEnrollment('enrollment-oscar-heli', 'usr-oscar-mendez-rivas'),
  individualEnrollment('enrollment-silvia-heli', 'usr-silvia-rueda-paz', '2025-03-03'),
  individualEnrollment('enrollment-natalia-heli', 'usr-natalia-rey-cubero', '2025-03-10'),
];

export const HELICOPTER_COURSE_GROUP_ASSIGNMENTS: GroupMissionAssignmentEntity[] = [
  {
    id: 'group-assignment-1',
    promotionId: HELICOPTER_COURSE_PROMOTION_ID,
    programId: HELICOPTER_COURSE_ID,
    scheduledDate: '2025-06-10',
    trainingLeadId: HELICOPTER_COURSE_INSTRUCTORS[0],
    status: 'completed',
    participantIds: [
      'usr-sofia-vidal',
      'usr-alba-ferrer-sol',
      'usr-hugo-pardo-leon',
      'usr-diego-molina',
      'usr-nuria-beltran-cid',
      'usr-oscar-mendez-rivas',
    ],
  },
];

export const HELICOPTER_COURSE_ASSIGNMENTS: IndividualMissionAssignmentEntity[] = [
  ...sofia.assignments,
  ...alba.assignments,
  ...hugo.assignments,
  ...diego.assignments,
  ...nuria.assignments,
  ...oscar.assignments,
  ...natalia.assignments,
  ...silvia.assignments,
  ...(silviaNext
    ? [
        {
          id: 'silvia-heli-as-open',
          assignmentCase: 'pdi' as const,
          studentId: 'usr-silvia-rueda-paz',
          externalPerson: null,
          programId: HELICOPTER_COURSE_ID,
          missionId: silviaNext,
          instructorId: HELICOPTER_COURSE_INSTRUCTORS[0],
          date: silviaOpenDate,
          status: 'scheduled' as const,
        },
      ]
    : []),
];

export const HELICOPTER_COURSE_EXECUTIONS: MissionExecutionEntity[] = [
  ...sofia.executions,
  ...alba.executions,
  ...hugo.executions,
  ...diego.executions,
  ...nuria.executions,
  ...oscar.executions,
  ...natalia.executions,
  ...silvia.executions,
  ...(silviaNext
    ? [
        {
          id: 'silvia-heli-ex-open',
          individualAssignmentId: 'silvia-heli-as-open',
          status: 'scheduled' as const,
          startDate: silviaOpenDate,
          startTime: '08:30',
          takeoffTime: '',
          landingTime: '',
          executedHours: 0,
          aircraftId: 'ac-hva',
          observations: '',
          strengths: '',
          improvements: '',
          recommendations: '',
          result: null,
          evaluations: [],
        },
      ]
    : []),
];

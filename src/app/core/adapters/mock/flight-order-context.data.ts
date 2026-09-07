import type {
  AircraftEntity,
  IndividualMissionAssignmentEntity,
  MissionExecutionEntity,
  ProgramEnrollmentEntity,
  PromotionEntity,
  PromotionMemberEntity,
  UserEntity,
} from '../../domain/entities/admin-catalog';
import { PPL_ENABLED_GROUND_COURSE_IDS, pplGroundEvaluations } from './ppl-ground-courses.data';

interface FlightOrderRosterSeed {
  tag: string;
  unitId: string;
  squadronId: string;
  label: string;
}

const ROSTERS: readonly FlightOrderRosterSeed[] = [
  { tag: 'nb', unitId: 'unit-norte', squadronId: 'sq-bravo', label: 'Norte Bravo' },
  { tag: 'nc', unitId: 'unit-norte', squadronId: 'sq-charlie', label: 'Norte Charlie' },
  { tag: 'ss', unitId: 'unit-sur', squadronId: 'sq-sur', label: 'Sur' },
  { tag: 'sd', unitId: 'unit-sur', squadronId: 'sq-delta', label: 'Sur Delta' },
  { tag: 'se', unitId: 'unit-sur', squadronId: 'sq-echo', label: 'Sur Echo' },
  { tag: 'af', unitId: 'unit-academia', squadronId: 'sq-formacion', label: 'Formación' },
  { tag: '510', unitId: 'unit-ga-51', squadronId: 'sq-510', label: 'EA-510' },
  { tag: '511', unitId: 'unit-ga-51', squadronId: 'sq-511', label: 'EA-511' },
  { tag: '512', unitId: 'unit-ga-51', squadronId: 'sq-512', label: 'EA-512' },
  { tag: '513', unitId: 'unit-ga-51', squadronId: 'sq-513', label: 'EA-513' },
  { tag: '842', unitId: 'unit-ga-8', squadronId: 'sq-842', label: 'EA-842' },
  { tag: '844', unitId: 'unit-ga-8', squadronId: 'sq-844', label: 'EA-844' },
];

const STUDENT_NAMES: ReadonlyArray<readonly [string, string]> = [
  ['Adela', 'Mena López'],
  ['Bruno', 'Roca Vidal'],
  ['Clara', 'Sanz Prieto'],
  ['Darío', 'Vega Nieto'],
  ['Elisa', 'Mora Gil'],
];

const INSTRUCTOR_NAMES: ReadonlyArray<readonly [string, string]> = [
  ['Nerea', 'Castro Rivas'],
  ['Óscar', 'León Prado'],
  ['Paula', 'Reyes Cubero'],
  ['Quim', 'Soler Pardo'],
  ['Rita', 'Nadal Ferrer'],
  ['Saúl', 'Pinto Lobo'],
  ['Tania', 'Gil Rueda'],
  ['Unai', 'Cano Marín'],
  ['Vera', 'Ortiz Senra'],
  ['Xabi', 'Lago Arias'],
  ['Yaiza', 'Duque Mena'],
  ['Zoe', 'Prado Soler'],
];

const SCHEDULED_DATE = '2026-10-02';
const AIRCRAFT_IMAGE = '/aircraft/ec-hva.jpg';

function userBase(
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  indicative: string,
  roleId: string,
  unitId: string,
  squadronId: string,
  specialtyId: string,
  documentNumber: string,
  rankCode: string,
  photoUrl?: string | null,
): UserEntity {
  return {
    id,
    firstName,
    lastName,
    email,
    documentNumber,
    entryDate: '2026-01-15',
    indicative,
    status: 'active',
    roleIds: [roleId],
    specialtyIds: [specialtyId],
    assignedUnitId: unitId,
    assignedSquadronId: squadronId,
    rankCode,
    photoUrl: photoUrl ?? null,
  };
}

function completedIrTrack(
  prefix: string,
  studentId: string,
  instructorId: string,
): { assignments: IndividualMissionAssignmentEntity[]; executions: MissionExecutionEntity[] } {
  const assignments: IndividualMissionAssignmentEntity[] = [];
  const executions: MissionExecutionEntity[] = [];
  for (let index = 1; index <= 3; index += 1) {
    const assignmentId = `${prefix}-ir-${index}`;
    const executionId = `${prefix}-ir-ex-${index}`;
    const date = `2026-06-0${index}`;
    assignments.push({
      id: assignmentId,
      assignmentCase: 'pdi',
      studentId,
      externalPerson: null,
      programId: 'prg-ir',
      missionId: 'mt-ifr',
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
      executedHours: 1.4,
      aircraftId: null,
      observations: '',
      strengths: '',
      improvements: '',
      recommendations: '',
      result: 'approved',
      evaluations: [
        { id: `${executionId}-ev`, maneuverId: 'man-hold', grade: 'B', observation: '', evidenceName: null },
      ],
    });
  }
  return { assignments, executions };
}

const built = ROSTERS.map((roster, rosterIndex) => {
  const instructorName = INSTRUCTOR_NAMES[rosterIndex] ?? INSTRUCTOR_NAMES[0];
  const instructorId = `usr-fo-${roster.tag}-ins`;
  const instructor = userBase(
    instructorId,
    instructorName[0],
    instructorName[1],
    `fo.${roster.tag}.ins@siga.demo`,
    `INS-${roster.tag.toUpperCase()}`,
    'role-instructor',
    roster.unitId,
    roster.squadronId,
    'spc-flight-inst',
    `${String(60000000 + rosterIndex).slice(0, 8)}A`,
    'CAP',
  );
  const roles = ['ready', 'next', 'scheduled', 'done', 'direct'] as const;
  const students = STUDENT_NAMES.map(([firstName, lastName], index) =>
    userBase(
      `usr-fo-${roster.tag}-${roles[index]}`,
      firstName,
      lastName,
      `fo.${roster.tag}.${roles[index]}@alumno.siga.demo`,
      `ALU-${roster.tag.toUpperCase()}-${index + 1}`,
      'role-student',
      roster.unitId,
      roster.squadronId,
      'spc-pilot',
      `${String(61000000 + rosterIndex * 10 + index).slice(0, 8)}B`,
      (['ALF', 'TEN', 'CAP', 'MAY'] as const)[index % 4],
      `/carnets/p${(index % 8) + 1}.jpg`,
    ),
  );
  const [ready, next, scheduled, done, direct] = students;
  const promotionId = `promotion-fo-${roster.tag}`;
  const promotion: PromotionEntity = {
    id: promotionId,
    code: `PROM-FO-${roster.tag.toUpperCase()}`,
    name: `Promoción ${roster.label} 2026`,
    year: 2026,
    unitId: roster.unitId,
    squadronId: roster.squadronId,
    startDate: '2026-01-12',
    endDate: '2026-12-18',
  };
  const members: PromotionMemberEntity[] = [ready, next, scheduled, done].map((student, index) => ({
    id: `fo-member-${roster.tag}-${index + 1}`,
    promotionId,
    userId: student.id,
    entryDate: '2026-01-12',
  }));
  const enroll = (
    id: string,
    userId: string,
    programId: string,
    source: 'promotion' | 'individual',
    promotionRef: string | null,
  ): ProgramEnrollmentEntity => ({
    id,
    programId,
    userId,
    promotionId: promotionRef,
    source,
    enrolledAt: '2026-01-12',
    status: 'active',
    closedAt: null,
    closeReason: null,
    ...(programId === 'prg-ppl'
      ? { groundCourseIds: [...PPL_ENABLED_GROUND_COURSE_IDS], groundEvaluations: pplGroundEvaluations() }
      : {}),
  });
  const enrollments: ProgramEnrollmentEntity[] = [
    enroll(`enrollment-fo-${roster.tag}-ready`, ready.id, 'prg-ppl', 'promotion', promotionId),
    enroll(`enrollment-fo-${roster.tag}-next`, next.id, 'prg-ppl', 'promotion', promotionId),
    enroll(`enrollment-fo-${roster.tag}-scheduled`, scheduled.id, 'prg-ppl', 'promotion', promotionId),
    enroll(`enrollment-fo-${roster.tag}-done`, done.id, 'prg-ir', 'promotion', promotionId),
    enroll(`enrollment-fo-${roster.tag}-direct`, direct.id, 'prg-ppl', 'individual', null),
  ];
  const nextAssignment: IndividualMissionAssignmentEntity = {
    id: `fo-as-${roster.tag}-next`,
    assignmentCase: 'pdi',
    studentId: next.id,
    externalPerson: null,
    programId: 'prg-ppl',
    missionId: 'mt-local',
    instructorId,
    date: '2026-08-12',
    status: 'completed',
  };
  const scheduledAssignment: IndividualMissionAssignmentEntity = {
    id: `fo-as-${roster.tag}-scheduled`,
    assignmentCase: 'pdi',
    studentId: scheduled.id,
    externalPerson: null,
    programId: 'prg-ppl',
    missionId: 'mt-local',
    instructorId,
    date: SCHEDULED_DATE,
    status: 'scheduled',
  };
  const nextExecution: MissionExecutionEntity = {
    id: `fo-ex-${roster.tag}-next`,
    individualAssignmentId: nextAssignment.id,
    status: 'completed',
    startDate: nextAssignment.date,
    startTime: '08:00',
    takeoffTime: '08:10',
    landingTime: '09:10',
    executedHours: 1.3,
    aircraftId: `ac-fo-${roster.tag}-a`,
    observations: '',
    strengths: '',
    improvements: '',
    recommendations: '',
    result: 'approved',
    evaluations: [
      { id: `fo-ex-${roster.tag}-next-ev`, maneuverId: 'man-toff', grade: 'B', observation: '', evidenceName: null },
    ],
  };
  const scheduledExecution: MissionExecutionEntity = {
    id: `fo-ex-${roster.tag}-scheduled`,
    individualAssignmentId: scheduledAssignment.id,
    status: 'scheduled',
    startDate: SCHEDULED_DATE,
    startTime: '09:00',
    takeoffTime: '',
    landingTime: '',
    executedHours: 0,
    aircraftId: `ac-fo-${roster.tag}-a`,
    observations: '',
    strengths: '',
    improvements: '',
    recommendations: '',
    result: null,
    evaluations: [
      { id: `fo-ex-${roster.tag}-scheduled-ev`, maneuverId: 'man-toff', grade: null, observation: '', evidenceName: null },
    ],
  };
  const ir = completedIrTrack(`fo-${roster.tag}`, done.id, instructorId);
  const aircraft: AircraftEntity[] = [
    {
      id: `ac-fo-${roster.tag}-a`,
      unitId: roster.unitId,
      fleetId: 'fleet-c152',
      registration: `EC-${roster.tag.toUpperCase()}A`.slice(0, 8),
      operational: true,
      status: 'active',
      imageUrl: AIRCRAFT_IMAGE,
    },
    {
      id: `ac-fo-${roster.tag}-b`,
      unitId: roster.unitId,
      fleetId: 'fleet-c152',
      registration: `EC-${roster.tag.toUpperCase()}B`.slice(0, 8),
      operational: true,
      status: 'active',
      imageUrl: AIRCRAFT_IMAGE,
    },
  ];
  return {
    users: [instructor, ...students],
    promotions: [promotion],
    members,
    enrollments,
    aircraft,
    assignments: [nextAssignment, scheduledAssignment, ...ir.assignments],
    executions: [nextExecution, scheduledExecution, ...ir.executions],
  };
});

export const FLIGHT_ORDER_CONTEXT_USERS: UserEntity[] = built.flatMap((item) => item.users);
export const FLIGHT_ORDER_CONTEXT_PROMOTIONS: PromotionEntity[] = built.flatMap((item) => item.promotions);
export const FLIGHT_ORDER_CONTEXT_MEMBERS: PromotionMemberEntity[] = built.flatMap((item) => item.members);
export const FLIGHT_ORDER_CONTEXT_ENROLLMENTS: ProgramEnrollmentEntity[] = built.flatMap((item) => item.enrollments);
export const FLIGHT_ORDER_CONTEXT_AIRCRAFT: AircraftEntity[] = built.flatMap((item) => item.aircraft);
export const FLIGHT_ORDER_CONTEXT_ASSIGNMENTS: IndividualMissionAssignmentEntity[] = built.flatMap(
  (item) => item.assignments,
);
export const FLIGHT_ORDER_CONTEXT_EXECUTIONS: MissionExecutionEntity[] = built.flatMap((item) => item.executions);

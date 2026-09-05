import { describe, expect, it } from 'vitest';
import type { IndividualMissionAssignmentEntity, MissionExecutionEntity, UserEntity } from '../entities/admin-catalog';
import {
  buildAcademicRecord,
  curriculumSlotEstimatedHours,
  nextPendingCurriculumSlot,
  plannedSlotsForProgram,
  classifyCurriculumPlannerSlots,
} from './academic-progress';

const user: UserEntity = {
  id: 'usr-1',
  firstName: 'Ana',
  lastName: 'Lima',
  email: 'ana@demo',
  documentNumber: '12345678A',
  entryDate: '2025-01-01',
  indicative: 'ALU-1',
  status: 'active',
  roleIds: ['role-student'],
  specialtyIds: [],
  assignedUnitId: 'unit-1',
  assignedSquadronId: 'sq-1',
};

const phases = [
  { id: 'ph-1', programId: 'prg-1', phaseBankId: 'pb-1', moduleKind: 'air' as const, sortOrder: 1 },
  { id: 'ph-2', programId: 'prg-1', phaseBankId: 'pb-2', moduleKind: 'air' as const, sortOrder: 2 },
];

const subphases = [
  {
    id: 'sp-1',
    phaseId: 'ph-1',
    subphaseBankId: 'sb-1',
    hours: 4,
    missionMode: 'manual' as const,
    missionTypeIds: ['mt-a', 'mt-b'],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: [],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: [],
    sortOrder: 1,
  },
  {
    id: 'sp-2',
    phaseId: 'ph-2',
    subphaseBankId: 'sb-2',
    hours: 2,
    missionMode: 'manual' as const,
    missionTypeIds: ['mt-c', 'mt-d'],
    customMissionNames: [],
    autoMissionCode: '',
    autoMissionCount: 0,
    maneuverIds: [],
    maneuverOperationIds: [],
    maneuverAssignment: {},
    standardAssignments: [],
    sortOrder: 1,
  },
];

function assignment(
  id: string,
  missionId: string,
  status: IndividualMissionAssignmentEntity['status'] = 'completed',
): IndividualMissionAssignmentEntity {
  return {
    id,
    assignmentCase: 'pdi',
    studentId: 'usr-1',
    externalPerson: null,
    programId: 'prg-1',
    missionId,
    instructorId: 'usr-ins',
    date: '2026-01-0' + id.slice(-1),
    status,
  };
}

function execution(
  id: string,
  assignmentId: string,
  hours: number,
  grade: 'B' | 'E',
): MissionExecutionEntity {
  return {
    id,
    individualAssignmentId: assignmentId,
    status: 'completed',
    startDate: '2026-01-01',
    startTime: '08:00',
    takeoffTime: '08:10',
    landingTime: '09:10',
    executedHours: hours,
    aircraftId: null,
    observations: '',
    strengths: '',
    improvements: '',
    recommendations: '',
    result: 'approved',
    evaluations: [
      { id: `${id}-ev`, maneuverId: 'man-1', grade, observation: '', evidenceName: null },
    ],
  };
}

describe('academic-progress', () => {
  it('cuenta las misiones planificadas del currículo', () => {
    expect(plannedSlotsForProgram('prg-1', phases, subphases)).toHaveLength(4);
  });

  it('estima horas por slot y señala la siguiente misión pendiente', () => {
    const slots = plannedSlotsForProgram('prg-1', phases, subphases);
    expect(curriculumSlotEstimatedHours(slots[0], subphases)).toBe(2);
    const pending = nextPendingCurriculumSlot('usr-1', 'prg-1', {
      phases,
      subphases,
      assignments: [assignment('as-1', 'mt-a'), assignment('as-2', 'mt-b')],
      executions: [execution('ex-1', 'as-1', 1.2, 'E'), execution('ex-2', 'as-2', 1, 'B')],
    });
    expect(pending?.slot.ref.value).toBe('mt-c');
    expect(pending?.openAssignment).toBeNull();
    const scheduled = nextPendingCurriculumSlot('usr-1', 'prg-1', {
      phases,
      subphases,
      assignments: [assignment('as-1', 'mt-a'), assignment('as-2', 'mt-b'), assignment('as-3', 'mt-c', 'scheduled')],
      executions: [execution('ex-1', 'as-1', 1.2, 'E'), execution('ex-2', 'as-2', 1, 'B')],
    });
    expect(scheduled?.openAssignment?.id).toBe('as-3');
  });

  it('clasifica misiones completadas, disponibles y bloqueadas', () => {
    const items = classifyCurriculumPlannerSlots('usr-1', 'prg-1', {
      phases,
      subphases,
      assignments: [assignment('as-1', 'mt-a'), assignment('as-2', 'mt-b')],
      executions: [execution('ex-1', 'as-1', 1.2, 'E'), execution('ex-2', 'as-2', 1, 'B')],
    });
    expect(items.map((item) => item.status)).toEqual(['completed', 'completed', 'available', 'blocked']);
  });

  it('marca recuperación cuando la misión ejecutada quedó desaprobada', () => {
    const failed: MissionExecutionEntity = {
      ...execution('ex-1', 'as-1', 1.2, 'E'),
      result: 'failed',
    };
    const items = classifyCurriculumPlannerSlots('usr-1', 'prg-1', {
      phases,
      subphases,
      assignments: [assignment('as-1', 'mt-a')],
      executions: [failed],
    });
    expect(items[0]?.status).toBe('recovery');
    expect(items[1]?.status).toBe('blocked');
  });

  it('calcula porcentaje, fase actual y promedio desde ejecuciones', () => {
    const { progress, record } = buildAcademicRecord({
      user,
      programs: [
        {
          id: 'prg-1',
          code: 'P1',
          name: 'Formación de Pilotos',
          programType: 'PPL',
          description: '',
          status: 'active',
          imageUrl: '',
          standardIds: [],
          lifecycleFlag: 'open',
        },
      ],
      phases,
      subphases,
      assignments: [assignment('as-1', 'mt-a'), assignment('as-2', 'mt-b'), assignment('as-3', 'mt-c', 'scheduled')],
      executions: [execution('ex-1', 'as-1', 1.2, 'E'), execution('ex-2', 'as-2', 1, 'B')],
    });

    expect(progress?.percentComplete).toBe(50);
    expect(progress?.completedMissions).toBe(2);
    expect(progress?.pendingMissions).toBe(2);
    expect(progress?.currentPhaseId).toBe('ph-2');
    expect(progress?.currentSubphaseId).toBe('sp-2');
    expect(progress?.instructorId).toBe('usr-ins');
    expect(progress?.accumulatedHours).toBe(2.2);
    expect(progress?.average).toBe(18);
    expect(record.programs[0]?.completedPhaseIds).toEqual(['ph-1']);
    expect(record.programs[0]?.status).toBe('in-progress');
  });

  it('abre el legajo al matricular aunque no haya misiones programadas', () => {
    const { progress, record } = buildAcademicRecord({
      user,
      programs: [
        {
          id: 'prg-1',
          code: 'P1',
          name: 'Formación de Pilotos',
          programType: 'PPL',
          description: '',
          status: 'active',
          imageUrl: '',
          standardIds: [],
          lifecycleFlag: 'open',
        },
      ],
      phases,
      subphases,
      assignments: [],
      executions: [],
      enrollments: [
        {
          id: 'en-1',
          programId: 'prg-1',
          userId: 'usr-1',
          promotionId: null,
          source: 'individual',
          enrolledAt: '2026-02-01',
          status: 'active',
          closedAt: null,
          closeReason: null,
        },
      ],
    });
    expect(record.programs).toHaveLength(1);
    expect(record.programs[0]?.startDate).toBe('2026-02-01');
    expect(progress?.percentComplete).toBe(0);
    expect(progress?.academicStatus).toBe('in-progress');
  });
});

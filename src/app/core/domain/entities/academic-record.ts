export const ACADEMIC_PROGRAM_STATUSES = ['in-progress', 'completed', 'suspended'] as const;
export type AcademicProgramStatus = (typeof ACADEMIC_PROGRAM_STATUSES)[number];

export const MANEUVER_GRADE_SCORES = {
  D: 8,
  I: 11,
  R: 14,
  B: 17,
  E: 19,
} as const;

export interface UserProgressEntity {
  userId: string;
  programId: string;
  percentComplete: number;
  currentPhaseId: string | null;
  currentSubphaseId: string | null;
  instructorId: string | null;
  completedMissions: number;
  pendingMissions: number;
  accumulatedHours: number;
  average: number | null;
  academicStatus: AcademicProgramStatus;
}

export interface RecordEvaluationEntity {
  assignmentId: string;
  missionId: string;
  date: string;
  result: string | null;
  average: number | null;
  instructorId: string | null;
}

export interface RecordProgramEntity {
  programId: string;
  status: AcademicProgramStatus;
  average: number | null;
  accumulatedHours: number;
  startDate: string | null;
  endDate: string | null;
  completedPhaseIds: string[];
  completedSubphaseIds: string[];
  executedMissionIds: string[];
  evaluations: RecordEvaluationEntity[];
  certifications: string[];
}

export interface RecordEntity {
  userId: string;
  programs: RecordProgramEntity[];
}

export type AcademicTimelineKind =
  | 'program-started'
  | 'phase-completed'
  | 'evaluation'
  | 'phase-started'
  | 'program-current';

export interface AcademicTimelineEvent {
  id: string;
  kind: AcademicTimelineKind;
  labelKey: AcademicTimelineKind;
  programId: string;
  phaseId: string | null;
  date: string | null;
}

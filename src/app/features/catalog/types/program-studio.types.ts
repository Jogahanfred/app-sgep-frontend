import type { ManeuverStandardAssignment, MissionAssignMode, ProgramModuleKind } from '@core/domain/entities';

export type StudioWizardStep = 'plan' | 'modules' | 'architecture' | 'matrix';
export type StudioDirbepCode = 'D' | 'I' | 'R' | 'B' | 'E' | 'P';

export interface StudioSubphase {
  key: string;
  subphaseBankId: string;
  hours: number;
  missionMode: MissionAssignMode;
  missionTypeIds: string[];
  customMissionNames: string[];
  autoMissionCode: string;
  autoMissionCount: number;
  maneuverIds: string[];
  maneuverOperationIds: string[];
  maneuverAssignment: Record<string, string>;
  standardAssignments: ManeuverStandardAssignment[];
}

export interface StudioPhase {
  key: string;
  phaseBankId: string;
  moduleKind: ProgramModuleKind;
  subphases: StudioSubphase[];
}

export interface GeneratedMission {
  key: string;
  label: string;
  kind: 'catalog' | 'custom' | 'series';
  origin: string;
  value: string;
}

export interface GroundSubjectDraft {
  name: string;
  hours: number;
  coefficient: number;
  minPassingGrade: number;
}

export interface GroundPeriodicDraft {
  period: string;
  exam: string;
  minPassingGrade: number;
  neiWeight: number;
}

export interface CurriculumHourShare {
  id: string;
  label: string;
  hours: number;
  percent: number;
  dasharray: string;
  dashoffset: number;
}

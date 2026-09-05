export const UI_PLANNER_MISSION_STATUSES = [
  'completed',
  'scheduled',
  'available',
  'blocked',
  'recovery',
  'update',
] as const;

export type UiPlannerMissionStatus = (typeof UI_PLANNER_MISSION_STATUSES)[number];

export interface UiPlannerMission {
  id: string;
  code: string;
  title: string;
  detail: string;
  status: UiPlannerMissionStatus;
  statusLabel: string;
  scoreLabel: string;
  actionLabel: string;
}

export interface UiPlannerSubphase {
  id: string;
  title: string;
  missions: readonly UiPlannerMission[];
}

export interface UiPlannerPhase {
  id: string;
  title: string;
  meta: string;
  progressLabel: string;
  subphases: readonly UiPlannerSubphase[];
  selectable?: boolean;
  selected?: boolean;
  selectDisabled?: boolean;
}

export interface UiPlannerRailItem {
  id: string;
  code: string;
  status: UiPlannerMissionStatus;
  scoreLabel: string;
}

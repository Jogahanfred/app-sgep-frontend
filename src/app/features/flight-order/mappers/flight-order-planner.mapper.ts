import type {
  FlightOrderCurriculum,
  FlightOrderMissionNode,
  FlightOrderMissionStatus,
  FlightOrderPhaseNode,
  FlightOrderSubphaseNode,
} from '@core/application';
import { GROUND_SUBJECT_WEIGHT, formatGroundDecimal } from '@core/domain/services/ground-instruction-grade';
import type { UiPlannerMissionStatus, UiPlannerPhase, UiPlannerRailItem } from '@shared/types/ui-planner-tree.types';
import { FLIGHT_ORDER_COPY } from '../constants/flight-order.copy.constants';
import { FLIGHT_ORDER_SCHEDULABLE } from '../types/flight-order.types';

function isSchedulable(status: FlightOrderMissionStatus): boolean {
  return (FLIGHT_ORDER_SCHEDULABLE as readonly string[]).includes(status);
}

function missionActionLabel(
  moduleKind: FlightOrderCurriculum['phases'][number]['moduleKind'],
  status: FlightOrderMissionStatus,
  canIssue: boolean,
): string {
  if (moduleKind === 'ground') return '';
  if (status === 'completed') return FLIGHT_ORDER_COPY.viewOrder;
  if (status === 'blocked' || !canIssue) return '';
  if (status === 'scheduled') return FLIGHT_ORDER_COPY.update;
  if (status === 'available') return FLIGHT_ORDER_COPY.scheduleMission;
  if (!isSchedulable(status)) return '';
  return FLIGHT_ORDER_COPY.enableMission;
}

export function curriculumByModule(
  curriculum: FlightOrderCurriculum,
  moduleKind: FlightOrderCurriculum['phases'][number]['moduleKind'],
): FlightOrderCurriculum {
  const phases = curriculum.phases.filter((phase) => phase.moduleKind === moduleKind);
  return {
    ...curriculum,
    phases,
    plannedHours: phases.reduce((sum, phase) => sum + phase.hours, 0),
  };
}

export function expandFlightOrderTree(curriculum: FlightOrderCurriculum): FlightOrderCurriculum {
  if (!curriculum.phases.length) return curriculum;
  const kind = curriculum.phases[0]?.moduleKind;
  if (kind === 'ground') return expandGroundCourses(curriculum);
  if (kind === 'simulator') return expandSimulatorLikeAir(curriculum);
  return curriculum;
}

export function flattenCurriculumMissions(curriculum: FlightOrderCurriculum): FlightOrderMissionNode[] {
  return curriculum.phases.flatMap((phase) => phase.subphases.flatMap((item) => item.missions));
}

export function toPlannerPhases(
  curriculum: FlightOrderCurriculum,
  canIssue: boolean,
  canAssignGround = false,
): UiPlannerPhase[] {
  return expandFlightOrderTree(curriculum).phases.map((phase) => ({
    id: phase.id,
    title: phase.name,
    meta: phaseMeta(phase),
    progressLabel: phase.loaded === false ? FLIGHT_ORDER_COPY.groundAssignPending : `${phase.percent}%`,
    ...(phase.moduleKind === 'ground'
      ? {
          selectable: true,
          selected: phase.loaded !== false,
          selectDisabled: !canAssignGround,
        }
      : {}),
    subphases: phase.subphases.map((subphase) => ({
      id: subphase.id,
      title: subphase.hours > 0 ? `${subphase.name} (${subphase.hours} ${FLIGHT_ORDER_COPY.hoursSuffix})` : subphase.name,
      missions: subphase.missions.map((mission) => ({
        id: mission.id,
        code: mission.code,
        title: mission.name,
        detail: missionDetail(mission),
        status: mission.status as UiPlannerMissionStatus,
        statusLabel:
          phase.moduleKind === 'ground' && mission.status === 'available'
            ? FLIGHT_ORDER_COPY.groundPending
            : FLIGHT_ORDER_COPY.missionStatus[mission.status],
        scoreLabel: mission.average === null ? '' : String(mission.average),
        actionLabel: missionActionLabel(phase.moduleKind, mission.status, canIssue),
      })),
    })),
  }));
}

export function toPlannerRail(curriculum: FlightOrderCurriculum): UiPlannerRailItem[] {
  const tree = expandFlightOrderTree(curriculum);
  if (tree.phases[0]?.moduleKind === 'ground') return [];
  return flattenCurriculumMissions(tree).map((mission) => ({
    id: mission.id,
    code: mission.code,
    status: mission.status as UiPlannerMissionStatus,
    scoreLabel: mission.average === null ? '' : String(mission.average),
  }));
}

export function plannerLegend(): { status: UiPlannerMissionStatus; label: string }[] {
  return [
    { status: 'completed', label: FLIGHT_ORDER_COPY.missionStatus.completed },
    { status: 'available', label: FLIGHT_ORDER_COPY.missionStatus.available },
    { status: 'scheduled', label: FLIGHT_ORDER_COPY.missionStatus.scheduled },
    { status: 'blocked', label: FLIGHT_ORDER_COPY.missionStatus.blocked },
    { status: 'recovery', label: FLIGHT_ORDER_COPY.missionStatus.recovery },
    { status: 'update', label: FLIGHT_ORDER_COPY.missionStatus.update },
  ];
}

function phaseMeta(phase: FlightOrderPhaseNode): string {
  const hours = `${phase.hours} ${FLIGHT_ORDER_COPY.hoursSuffix}`;
  if (phase.moduleKind === 'ground') {
    if (phase.loaded === false) {
      return `${hours} · ${FLIGHT_ORDER_COPY.groundAssignPending}`;
    }
    const pe = formatGroundDecimal(GROUND_SUBJECT_WEIGHT.examAverage);
    const pt = formatGroundDecimal(GROUND_SUBJECT_WEIGHT.testAverage);
    const formula =
      phase.coefficient === undefined
        ? ''
        : `${FLIGHT_ORDER_COPY.groundNa} = ${FLIGHT_ORDER_COPY.groundPe} (${pe}) + ${FLIGHT_ORDER_COPY.groundPt} (${pt})`;
    const coef =
      phase.coefficient === undefined ? '' : `${FLIGHT_ORDER_COPY.groundCoef} ${formatGroundDecimal(phase.coefficient)}`;
    const evals = `${phase.completedCount} ${FLIGHT_ORDER_COPY.ofMissions} ${phase.missionCount} ${FLIGHT_ORDER_COPY.evaluationsWord}`;
    return [formula, coef, hours, evals].filter((item) => item.length > 0).join(' · ');
  }
  if (phase.missionCount > 0) {
    return `${hours} · ${phase.completedCount} ${FLIGHT_ORDER_COPY.ofMissions} ${phase.missionCount}`;
  }
  return `${hours} · ${phase.subphases.length} ${FLIGHT_ORDER_COPY.subjectsWord}`;
}

function missionDetail(mission: FlightOrderMissionNode): string {
  const parts: string[] = [];
  if (mission.hours > 0) parts.push(`${mission.hours} ${FLIGHT_ORDER_COPY.hoursSuffix}`);
  if (mission.average !== null) parts.push(`${FLIGHT_ORDER_COPY.groundGrade}: ${mission.average}`);
  if (mission.instructorName) parts.push(`${FLIGHT_ORDER_COPY.dualWith}: ${mission.instructorName}`);
  if (mission.scheduledDate) parts.push(mission.scheduledDate);
  return parts.join(' · ');
}

function tally(missions: readonly FlightOrderMissionNode[]): Pick<FlightOrderPhaseNode, 'completedCount' | 'missionCount' | 'percent'> {
  const missionCount = missions.length;
  const completedCount = missions.filter((item) => item.status === 'completed').length;
  return {
    completedCount,
    missionCount,
    percent: missionCount === 0 ? 0 : Math.round((completedCount / missionCount) * 100),
  };
}

function expandSimulatorLikeAir(curriculum: FlightOrderCurriculum): FlightOrderCurriculum {
  const phases: FlightOrderPhaseNode[] = curriculum.phases.flatMap((phase) =>
    phase.subphases.map((subphase) => {
      const missions = subphase.missions;
      const counts = tally(missions);
      return {
        id: subphase.id,
        name: subphase.name,
        moduleKind: 'simulator' as const,
        hours: subphase.hours,
        ...counts,
        subphases: [
          {
            id: `${subphase.id}-missions`,
            name: FLIGHT_ORDER_COPY.treeMissions,
            hours: subphase.hours,
            missions,
          },
        ],
      };
    }),
  );
  return {
    ...curriculum,
    phases,
    plannedHours: phases.reduce((sum, item) => sum + item.hours, 0),
  };
}

function expandGroundCourses(curriculum: FlightOrderCurriculum): FlightOrderCurriculum {
  const phases: FlightOrderPhaseNode[] = curriculum.phases.flatMap((phase) =>
    phase.subphases.map((course) => {
      const missions = course.missions;
      const counts = tally(missions);
      const subphases: FlightOrderSubphaseNode[] = [
        {
          id: `${course.id}-evals`,
          name: '',
          hours: 0,
          missions,
        },
      ];
      return {
        id: course.id,
        name: course.name,
        moduleKind: 'ground' as const,
        hours: course.hours,
        loaded: course.loaded !== false,
        ...(course.coefficient !== undefined ? { coefficient: course.coefficient } : {}),
        ...counts,
        subphases,
      };
    }),
  );
  return {
    ...curriculum,
    phases,
    plannedHours: phases.reduce((sum, item) => sum + item.hours, 0),
  };
}

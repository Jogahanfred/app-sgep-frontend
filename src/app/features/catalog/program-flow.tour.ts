export type FlowTourKind = 'intro' | 'phase' | 'lesson' | 'mission' | 'maneuvers' | 'finish';
export type FlowTourTarget = 'phase' | 'lesson' | 'mission' | 'maneuvers';
export type FlowTourMemory = 'idle' | 'started' | 'skipped' | 'completed';

interface TourLessonSource {
  name: string;
  missions: { name: string; detail: string }[];
}

interface TourPhaseSource {
  name: string;
  lessons: TourLessonSource[];
}

export interface FlowTourStep {
  kind: FlowTourKind;
  title: string;
  body: string;
  eyebrow: string;
  target: FlowTourTarget | null;
  phaseIndex: number;
  lessonIndex: number;
  missionIndex: number;
}

const MEMORY_KEY = 'siga-flow-tour';

export function pickTourPath(phases: TourPhaseSource[]): { phaseIndex: number; lessonIndex: number } {
  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex += 1) {
    const lessons = phases[phaseIndex].lessons;
    for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex += 1) {
      if (lessons[lessonIndex].missions.length) {
        return { phaseIndex, lessonIndex };
      }
    }
  }
  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex += 1) {
    if (phases[phaseIndex].lessons.length) {
      return { phaseIndex, lessonIndex: 0 };
    }
  }
  return { phaseIndex: phases.length ? 0 : -1, lessonIndex: -1 };
}

export function buildFlowTourSteps(phases: TourPhaseSource[]): FlowTourStep[] {
  const steps: FlowTourStep[] = [
    {
      kind: 'intro',
      title: 'El programa',
      body: 'En este recorrido conocerás cómo está organizado el programa y cómo avanzar por sus diferentes niveles de entrenamiento.',
      eyebrow: 'Programa',
      target: null,
      phaseIndex: -1,
      lessonIndex: -1,
      missionIndex: -1,
    },
  ];

  const path = pickTourPath(phases);
  const phase = path.phaseIndex >= 0 ? phases[path.phaseIndex] : null;
  if (phase) {
    steps.push({
      kind: 'phase',
      title: phase.name,
      body: 'Una fase es una etapa del entrenamiento. El programa avanza de la primera fase al cierre.',
      eyebrow: 'Fase',
      target: 'phase',
      phaseIndex: path.phaseIndex,
      lessonIndex: -1,
      missionIndex: -1,
    });
  }

  const lesson = phase && path.lessonIndex >= 0 ? (phase.lessons[path.lessonIndex] ?? null) : null;
  if (lesson) {
    steps.push({
      kind: 'lesson',
      title: lesson.name,
      body: 'Programa → Fase → Subfase. La subfase concreta las horas, las misiones y el acceso a las maniobras.',
      eyebrow: 'Subfase',
      target: 'lesson',
      phaseIndex: path.phaseIndex,
      lessonIndex: path.lessonIndex,
      missionIndex: -1,
    });
    lesson.missions.forEach((mission, missionIndex) => {
      steps.push({
        kind: 'mission',
        title: mission.name,
        body: mission.detail || 'Cada misión es una unidad de vuelo o de aula dentro de esta subfase.',
        eyebrow: `Misión ${missionIndex + 1}`,
        target: 'mission',
        phaseIndex: path.phaseIndex,
        lessonIndex: path.lessonIndex,
        missionIndex,
      });
    });
    steps.push({
      kind: 'maneuvers',
      title: 'Ver maniobras',
      body: 'Desde aquí puedes consultar las maniobras asociadas a esta subfase.',
      eyebrow: 'Maniobras',
      target: 'maneuvers',
      phaseIndex: path.phaseIndex,
      lessonIndex: path.lessonIndex,
      missionIndex: -1,
    });
  }

  steps.push({
    kind: 'finish',
    title: 'Ya conoces la estructura',
    body: 'El programa se organiza así: Programa → Fase → Subfase → Misiones → Maniobras. Ya puedes recorrer el itinerario por tu cuenta.',
    eyebrow: 'Fin',
    target: null,
    phaseIndex: path.phaseIndex,
    lessonIndex: path.lessonIndex,
    missionIndex: -1,
  });

  return steps;
}

export function readTourMemory(programId: string): FlowTourMemory {
  if (!programId) return 'idle';
  try {
    const raw = sessionStorage.getItem(MEMORY_KEY);
    if (!raw) return 'idle';
    const data = JSON.parse(raw) as Record<string, FlowTourMemory>;
    return data[programId] ?? 'idle';
  } catch {
    return 'idle';
  }
}

export function writeTourMemory(programId: string, status: Exclude<FlowTourMemory, 'idle'>): void {
  if (!programId) return;
  try {
    const raw = sessionStorage.getItem(MEMORY_KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, FlowTourMemory>) : {};
    data[programId] = status;
    sessionStorage.setItem(MEMORY_KEY, JSON.stringify(data));
  } catch {
    return;
  }
}

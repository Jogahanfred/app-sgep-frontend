import { buildFlowTourSteps, pickTourPath, readTourMemory, writeTourMemory } from './program-flow.tour';

const emptyLesson = {
  name: 'AULA · Aula',
  missions: [] as { name: string; detail: string }[],
};

const dualLesson = {
  name: 'DUAL · Dual',
  missions: [
    { name: 'LOC · Misión local', detail: 'Circuito' },
    { name: 'Circuito corto', detail: 'Propia' },
    { name: 'Circuito largo', detail: 'Propia' },
  ],
};

describe('program-flow.tour', () => {
  it('elige la primera subfase que tenga misiones y genera un paso por cada una', () => {
    const phases = [
      { name: 'TEO · Teoría en aula', lessons: [emptyLesson] },
      { name: 'BAS · Vuelo básico', lessons: [dualLesson] },
    ];
    expect(pickTourPath(phases)).toEqual({ phaseIndex: 1, lessonIndex: 0 });
    const steps = buildFlowTourSteps(phases);
    const missions = steps.filter((step) => step.kind === 'mission');
    expect(missions).toHaveLength(3);
    expect(missions.map((step) => step.title)).toEqual([
      'LOC · Misión local',
      'Circuito corto',
      'Circuito largo',
    ]);
    expect(steps.map((step) => step.kind)).toEqual([
      'intro',
      'phase',
      'lesson',
      'mission',
      'mission',
      'mission',
      'maneuvers',
      'finish',
    ]);
    expect(steps.find((step) => step.kind === 'phase')?.title).toBe('BAS · Vuelo básico');
    expect(steps.filter((step) => step.kind === 'maneuvers')).toHaveLength(1);
  });

  it('si no hay misiones, sigue a Ver maniobras sin romper el recorrido', () => {
    const steps = buildFlowTourSteps([{ name: 'TEO', lessons: [emptyLesson] }]);
    expect(steps.map((step) => step.kind)).toEqual(['intro', 'phase', 'lesson', 'maneuvers', 'finish']);
  });

  it('si no hay subfase, solo presenta el programa, la fase y el cierre', () => {
    const steps = buildFlowTourSteps([{ name: 'TEO', lessons: [] }]);
    expect(steps.map((step) => step.kind)).toEqual(['intro', 'phase', 'finish']);
  });

  it('recuerda omitido y completado en sessionStorage', () => {
    sessionStorage.clear();
    expect(readTourMemory('prg-ppl')).toBe('idle');
    writeTourMemory('prg-ppl', 'skipped');
    expect(readTourMemory('prg-ppl')).toBe('skipped');
    writeTourMemory('prg-ppl', 'completed');
    expect(readTourMemory('prg-ppl')).toBe('completed');
    expect(readTourMemory('prg-ir')).toBe('idle');
  });
});

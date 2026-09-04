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
  it('elige la primera subfase con misiones y, tras ella, un solo paso de matriz', () => {
    const phases = [
      { name: 'TEO · Teoría en aula', lessons: [emptyLesson] },
      { name: 'BAS · Vuelo básico', lessons: [dualLesson] },
    ];
    expect(pickTourPath(phases)).toEqual({ phaseIndex: 1, lessonIndex: 0 });
    const steps = buildFlowTourSteps(phases);
    expect(steps.map((step) => step.kind)).toEqual(['intro', 'phase', 'lesson', 'matrix', 'finish']);
    expect(steps.find((step) => step.kind === 'phase')?.title).toBe('FASE 2');
    expect(steps.find((step) => step.kind === 'matrix')?.body).toContain('eje X');
    expect(steps.find((step) => step.kind === 'matrix')?.body).toContain('eje Y');
    expect(steps.filter((step) => step.kind === 'matrix')).toHaveLength(1);
  });

  it('si no hay misiones, sigue a la matriz sin romper el recorrido', () => {
    const steps = buildFlowTourSteps([{ name: 'TEO', lessons: [emptyLesson] }]);
    expect(steps.map((step) => step.kind)).toEqual(['intro', 'phase', 'lesson', 'matrix', 'finish']);
    expect(steps.find((step) => step.kind === 'phase')?.title).toBe('FASE 1');
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

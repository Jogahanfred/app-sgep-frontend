import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { GROUND_ASSESSMENT_LABEL } from '../../domain/services/ground-instruction-grade';
import { GetFlightOrderBoard } from './get-flight-order-board';

const norteAlfa: OperationalContext = {
  userId: 'usr-elena-martin',
  displayName: 'Elena Martín Ruiz',
  roleCode: 'ADSYS',
  assignedUnitId: null,
  assignedSquadronId: null,
  unitId: 'unit-norte',
  squadronId: 'sq-alfa',
  coversAllSquadrons: false,
};

describe('GetFlightOrderBoard', () => {
  it('lista alumnos matriculados por promoción y de forma directa', async () => {
    const board = await firstValueFrom(new GetFlightOrderBoard(new MockAdminCatalogRepository()).execute(norteAlfa));
    expect(board.needsSquadron).toBe(false);
    expect(board.canIssue).toBe(true);
    expect(board.instructors.some((item) => item.id === 'usr-pablo-nunez')).toBe(true);
    expect(board.aircraft.some((item) => item.id === 'ac-hva')).toBe(true);
    expect(board.trainees.some((item) => item.userId === 'usr-diego-molina' && item.source === 'promotion')).toBe(true);
    expect(
      board.trainees.some(
        (item) =>
          item.userId === 'usr-silvia-rueda-paz' &&
          item.source === 'individual' &&
          item.programId === 'prg-heli-2023' &&
          item.status === 'scheduled',
      ),
    ).toBe(true);
    expect(
      board.trainees.some(
        (item) =>
          item.userId === 'usr-natalia-rey-cubero' &&
          item.source === 'individual' &&
          item.programId === 'prg-heli-2023' &&
          item.status === 'ready',
      ),
    ).toBe(true);
    const sofia = board.trainees.find((item) => item.userId === 'usr-sofia-vidal' && item.programId === 'prg-heli-2023');
    expect(sofia?.status).toBe('completed');
    expect(sofia?.programCulminated).toBe(true);
    expect(board.focusProgramId).toBe('prg-heli-2023');
    expect(board.trainees.some((item) => item.status === 'ready')).toBe(true);
    expect(board.trainees.some((item) => item.status === 'scheduled')).toBe(true);
    expect(board.cohorts[0]?.promotionId).toBe('promotion-2026-i');
    expect(board.cohorts.some((item) => item.promotionId === 'promotion-2025-alfa' && item.programNames.some((name) => name.includes('Helicóptero')))).toBe(
      true,
    );
    const diego = board.trainees.find((item) => item.userId === 'usr-diego-molina' && item.programId === 'prg-heli-2023');
    expect(diego?.percentComplete).toBeGreaterThan(0);
    expect(diego?.curriculum.phases).toHaveLength(9);
    expect(diego?.curriculum.phases.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        'Curso en tierra piloto de helicóptero · primera parte',
        'Simulador de vuelo',
        'Adaptación',
        'Operaciones helitransportadas',
        'Operaciones aerotácticas',
        'Orden de operaciones',
        'Complemento de fase',
      ]),
    );
    expect(diego?.curriculum.phases[0]?.moduleKind).toBe('ground');
    expect(diego?.curriculum.phases[0]?.subphases.find((item) => item.name === 'Matemática')?.loaded).toBe(false);
    expect(diego?.curriculum.phases[0]?.subphases.find((item) => item.name === 'Matemática')?.missions).toEqual([]);
    const aero = diego?.curriculum.phases[0]?.subphases.find((item) => item.name.includes('Aerodinámica'));
    expect(aero?.missions.map((item) => item.name)).toEqual([
      `${GROUND_ASSESSMENT_LABEL.test} 1`,
      `${GROUND_ASSESSMENT_LABEL.test} 2`,
      GROUND_ASSESSMENT_LABEL.oral,
      GROUND_ASSESSMENT_LABEL.partial,
      GROUND_ASSESSMENT_LABEL.final,
    ]);
    expect(aero?.missions[0]?.average).not.toBeNull();
    const ing = diego?.curriculum.phases[0]?.subphases.find((item) => item.name.includes('Ingeniería'));
    expect(ing?.missions.map((item) => item.name)).toEqual([
      `${GROUND_ASSESSMENT_LABEL.exam} 1`,
      `${GROUND_ASSESSMENT_LABEL.exam} 2`,
      GROUND_ASSESSMENT_LABEL.partial,
      GROUND_ASSESSMENT_LABEL.final,
    ]);
    expect(diego?.curriculum.phases.some((item) => item.moduleKind === 'air' && item.name === 'Adaptación')).toBe(true);
    expect(diego?.curriculum.phases.some((item) => item.moduleKind === 'simulator')).toBe(true);
    const alba = board.trainees.find((item) => item.userId === 'usr-alba-ferrer-sol' && item.programId === 'prg-heli-2023');
    expect(alba?.percentComplete).toBe(100);
  });

  it('pinta promoción, alumnos y aeronaves en el Grupo Aéreo 51', async () => {
    const board = await firstValueFrom(
      new GetFlightOrderBoard(new MockAdminCatalogRepository()).execute({
        ...norteAlfa,
        unitId: 'unit-ga-51',
        squadronId: 'sq-510',
      }),
    );
    expect(board.cohorts.some((item) => item.promotionId === 'promotion-fo-510')).toBe(true);
    expect(board.trainees.some((item) => item.userId === 'usr-fo-510-ready' && item.status === 'ready')).toBe(true);
    expect(board.trainees.some((item) => item.userId === 'usr-fo-510-scheduled' && item.status === 'scheduled')).toBe(
      true,
    );
    expect(board.trainees.some((item) => item.userId === 'usr-fo-510-done' && item.status === 'completed')).toBe(true);
    expect(board.trainees.some((item) => item.userId === 'usr-fo-510-direct' && item.source === 'individual')).toBe(
      true,
    );
    expect(board.aircraft.length).toBeGreaterThan(0);
    expect(board.instructors.some((item) => item.id === 'usr-fo-510-ins')).toBe(true);
    const ppl = board.trainees.find((item) => item.userId === 'usr-fo-510-ready');
    expect(ppl?.groundCourses.map((item) => item.name)).toEqual([
      'Teoría Aeronáutica I',
      'Meteorología Aeronáutica',
      'Navegación Aérea',
      'Reglamentación Aeronáutica',
      'Operaciones de Vuelo',
      'Procedimientos de Vuelo',
      'Simulador de Vuelo',
      'Entrenamiento de Vuelo',
      'Evaluación Integral',
    ]);
    expect(ppl?.groundCourses.filter((item) => item.loaded).map((item) => item.name)).toEqual([
      'Teoría Aeronáutica I',
      'Meteorología Aeronáutica',
      'Navegación Aérea',
      'Reglamentación Aeronáutica',
      'Operaciones de Vuelo',
    ]);
    const tea = ppl?.curriculum.phases
      .flatMap((phase) => phase.subphases)
      .find((item) => item.name === 'Teoría Aeronáutica I');
    expect(tea?.missions.map((item) => item.name)).toEqual([
      'Práctica 1',
      'Práctica 2',
      'Exposición',
      'Parcial',
      'Examen Final',
    ]);
    expect(tea?.missions.map((item) => item.average)).toEqual([16, 15, 17, 14, 16]);
    const opv = ppl?.curriculum.phases
      .flatMap((phase) => phase.subphases)
      .find((item) => item.name === 'Operaciones de Vuelo');
    expect(opv?.missions.map((item) => item.status)).toEqual([
      'completed',
      'completed',
      'completed',
      'available',
      'blocked',
    ]);
    const prf = ppl?.curriculum.phases.flatMap((phase) => phase.subphases).find((item) => item.name === 'Procedimientos de Vuelo');
    expect(prf?.loaded).toBe(false);
    expect(prf?.missions).toEqual([]);
  });

  it('no emite con rol de piloto', async () => {
    const board = await firstValueFrom(
      new GetFlightOrderBoard(new MockAdminCatalogRepository()).execute({
        ...norteAlfa,
        roleCode: 'PILOT',
        userId: 'usr-diego-molina',
      }),
    );
    expect(board.canIssue).toBe(false);
  });
});

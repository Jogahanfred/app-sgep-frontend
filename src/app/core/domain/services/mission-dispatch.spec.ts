import { describe, expect, it } from 'vitest';
import {
  addClockHours,
  canDispatchMission,
  canOpenLiveEvaluation,
  dispatchOccupancyPercent,
  dispatchSlotKind,
  markReadyDispatchSlot,
  maneuverProgressPercent,
  shiftIsoCalendarDate,
} from './mission-dispatch';

describe('mission-dispatch', () => {
  it('permite despachar a instrucción y no al piloto', () => {
    expect(canDispatchMission('JINST')).toBe(true);
    expect(canDispatchMission('INSTR')).toBe(true);
    expect(canDispatchMission('PILOT')).toBe(false);
    expect(canDispatchMission('AUDIT')).toBe(false);
    expect(canOpenLiveEvaluation('EVALU')).toBe(true);
    expect(canOpenLiveEvaluation('PILOT')).toBe(false);
  });

  it('clasifica el slot según asignación y ejecución', () => {
    expect(dispatchSlotKind('cancelled', 'scheduled')).toBe('cancelled');
    expect(dispatchSlotKind('scheduled', 'completed')).toBe('closed');
    expect(dispatchSlotKind('in-progress', 'scheduled')).toBe('airborne');
    expect(dispatchSlotKind('scheduled', 'scheduled')).toBe('pending');
  });

  it('marca como lista la primera pendiente con requisitos', () => {
    const marked = markReadyDispatchSlot([
      { kind: 'airborne' as const, startTime: '08:30', canBecomeReady: false },
      { kind: 'pending' as const, startTime: '14:00', canBecomeReady: true },
      { kind: 'pending' as const, startTime: '10:15', canBecomeReady: true },
    ]);
    expect(marked.map((item) => item.kind)).toEqual(['airborne', 'pending', 'ready']);
  });

  it('calcula ocupación y avance de rúbrica', () => {
    expect(dispatchOccupancyPercent(14, 18)).toBe(77.8);
    expect(maneuverProgressPercent([{ id: 'a', maneuverId: 'm', grade: 'B', observation: '', evidenceName: null }])).toBe(100);
    expect(maneuverProgressPercent([])).toBeNull();
  });

  it('desplaza fechas ISO en calendario local', () => {
    expect(shiftIsoCalendarDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftIsoCalendarDate('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('calcula el fin de slot a partir de la hora de inicio', () => {
    expect(addClockHours('10:15', 1.5)).toBe('11:45');
  });
});

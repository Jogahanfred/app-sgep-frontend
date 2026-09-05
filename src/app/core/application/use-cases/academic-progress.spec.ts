import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { GetAcademicRecord } from './get-academic-record';
import { ListAcademicProgress } from './list-academic-progress';

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

describe('avance académico', () => {
  it('lista alumnos del contexto y calcula el progreso del programa actual', async () => {
    const repo = new MockAdminCatalogRepository();
    const board = await firstValueFrom(new ListAcademicProgress(repo).execute(norteAlfa));
    expect(board.needsSquadron).toBe(false);
    const sofia = board.rows.find((row) => row.userId === 'usr-sofia-vidal');
    expect(sofia?.programName).toBe('Curso Piloto de Helicóptero');
    expect(sofia?.percentComplete).toBe(100);
    expect(sofia?.academicStatus).toBe('completed');
    expect(board.rows.some((row) => row.userId === 'usr-diego-molina')).toBe(true);
    expect(board.rows.find((row) => row.userId === 'usr-diego-molina')?.academicStatus).toBe('in-progress');
    expect(board.rows.some((row) => row.userId === 'usr-mario-castillo')).toBe(false);
  });

  it('expone el historial de programas y el detalle de la trayectoria', async () => {
    const detail = await firstValueFrom(
      new GetAcademicRecord(new MockAdminCatalogRepository()).execute(norteAlfa, 'usr-sofia-vidal'),
    );
    expect(detail.history.map((item) => item.programCode)).toEqual(['PDI-HELI-2023', 'PPL-AF', 'IR-ME']);
    expect(detail.history.find((item) => item.programCode === 'PPL-AF')?.program.status).toBe('completed');
    expect(detail.progress?.percentComplete).toBe(100);
    expect(detail.progress?.academicStatus).toBe('completed');
    expect(detail.specialtyNames).toContain('Pilotaje');
    const heli = detail.history.find((item) => item.programCode === 'PDI-HELI-2023');
    expect(heli?.rank).toBe(1);
    expect(heli?.academicYear).toBe(2025);
    expect(heli?.culminated).toBe(true);
    expect(heli?.evaluations.some((item) => item.instructorName)).toBe(true);
  });

  it('conserva el historial de un alumno dado de baja', async () => {
    const detail = await firstValueFrom(
      new GetAcademicRecord(new MockAdminCatalogRepository()).execute(norteAlfa, 'usr-teresa-gil-pascual'),
    );
    const ppl = detail.history.find((item) => item.program.programId === 'prg-ppl');
    expect(ppl?.enrollmentStatus).toBe('dropped');
    expect(ppl?.promotionName).toContain('2026');
    expect(ppl?.closeReason).toBe('Incumplimiento académico');
    expect(ppl?.closedAt).toBe('2026-09-04');
    expect(ppl?.canContinue).toBe(false);
    expect(ppl?.evaluations.length).toBeGreaterThanOrEqual(3);
    expect(detail.progress?.completedMissions).toBeGreaterThanOrEqual(3);
    expect(detail.progress?.accumulatedHours).toBeGreaterThan(0);
  });
});

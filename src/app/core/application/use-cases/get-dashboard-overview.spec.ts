import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { GetDashboardOverview } from './get-dashboard-overview';

const director: OperationalContext = {
  userId: 'usr-elena-martin',
  displayName: 'Elena',
  roleCode: 'ADSYS',
  assignedUnitId: null,
  assignedSquadronId: null,
  unitId: 'unit-norte',
  squadronId: 'sq-alfa',
  coversAllSquadrons: false,
};

const instructor: OperationalContext = {
  ...director,
  userId: 'usr-pablo-nunez',
  roleCode: 'INSTR',
  assignedUnitId: 'unit-norte',
  assignedSquadronId: 'sq-alfa',
};

const student: OperationalContext = {
  ...director,
  userId: 'usr-sofia-vidal',
  roleCode: 'PILOT',
  assignedUnitId: 'unit-norte',
  assignedSquadronId: 'sq-alfa',
};

describe('GetDashboardOverview', () => {
  it('arma el panel de dirección con el contexto de unidad y escuadrón', async () => {
    const dash = await firstValueFrom(new GetDashboardOverview(new MockAdminCatalogRepository()).execute(director, '2026-02-12'));
    expect(dash.kind).toBe('director');
    if (dash.kind !== 'director') return;
    expect(dash.activeStudents).toBeGreaterThan(0);
    expect(dash.hoursFlown).toBeGreaterThan(0);
    expect(dash.missionsToday).toBeGreaterThanOrEqual(1);
    expect(dash.academicActivity.length).toBeGreaterThan(0);
  });

  it('arma el panel del instructor con sus asignaciones', async () => {
    const dash = await firstValueFrom(new GetDashboardOverview(new MockAdminCatalogRepository()).execute(instructor, '2025-09-08'));
    expect(dash.kind).toBe('instructor');
    if (dash.kind !== 'instructor') return;
    expect(dash.assignedStudents).toBeGreaterThan(0);
    expect(dash.assignedMissions).toBeGreaterThan(0);
  });

  it('arma el panel del alumno con su avance', async () => {
    const dash = await firstValueFrom(new GetDashboardOverview(new MockAdminCatalogRepository()).execute(student, '2026-09-04'));
    expect(dash.kind).toBe('student');
    if (dash.kind !== 'student') return;
    expect(dash.percentComplete).toBe(100);
    expect(dash.programName).toContain('Helicóptero');
  });
});

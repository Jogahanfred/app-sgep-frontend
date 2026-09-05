import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import type { OperationalContext } from '../../domain/entities/operational-context';
import { GetOperationalReport, reportKindsForRole } from './get-operational-report';

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

describe('GetOperationalReport', () => {
  it('restringe los reportes del piloto a su historial', () => {
    expect(reportKindsForRole('PILOT')).toEqual(['student-history']);
    expect(reportKindsForRole('ADSYS').length).toBeGreaterThan(1);
  });

  it('consulta ranking de alumnos del contexto', async () => {
    const report = await firstValueFrom(
      new GetOperationalReport(new MockAdminCatalogRepository()).execute(director, {
        kind: 'student-ranking',
        from: null,
        to: null,
        programId: null,
        promotionId: null,
        studentId: null,
        instructorId: null,
        aircraftId: null,
      }),
    );
    expect(report.kind).toBe('student-ranking');
    expect(report.rows.length).toBeGreaterThan(0);
    expect(report.rows.some((row) => row['student']?.includes('Sofía'))).toBe(true);
  });
});

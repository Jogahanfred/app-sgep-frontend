import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MockAdminCatalogRepository } from '../../adapters/mock/mock-admin-catalog.repository';
import { MockFlightIncidentRepository } from '../../adapters/mock/mock-flight-incident.repository';
import { InvalidAdminCatalogError } from '../../domain/errors/domain-error';
import { CreateFlightIncident } from './create-flight-incident';
import { GetFlightIncidentBoard, isIncidentInDateRange, matchesIncidentBucket } from './get-flight-incident-board';
import { GetFlightIncidentContext } from './get-flight-incident-context';
import { GetFlightIncident } from './get-flight-incident';
import { TakeFlightIncidentAction } from './take-flight-incident-action';

describe('flight incident use cases', () => {
  it('prepara el contexto de la misión lista para despacho', async () => {
    const context = await firstValueFrom(
      new GetFlightIncidentContext(new MockAdminCatalogRepository()).execute('execution-dispatch-ready'),
    );
    expect(context.executionId).toBe('execution-dispatch-ready');
    expect(context.missionId).toBeTruthy();
    expect(context.aircraftOptions.length).toBeGreaterThan(0);
  });

  it('exige declaración y descripción para despachar', async () => {
    const create = new CreateFlightIncident(new MockFlightIncidentRepository());
    await expect(
      firstValueFrom(
        create.execute({
          executionId: 'execution-dispatch-ready',
          missionId: 'mission-1',
          aircraftId: 'ac-hva',
          detectedAt: '',
          sector: '',
          phase: 'enroute',
          incidentType: 'maintenance',
          severity: 'mel',
          summary: '',
          ataCode: 'ATA-29',
          instrumentReading: '',
          caution: '',
          description: '',
          crewAction: '',
          evidenceName: null,
          declared: false,
          status: 'submitted',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidAdminCatalogError);
  });

  it('registra un borrador y un despacho válido', async () => {
    const create = new CreateFlightIncident(new MockFlightIncidentRepository());
    const draft = await firstValueFrom(
      create.execute({
        executionId: 'execution-dispatch-ready',
        missionId: 'mission-1',
        aircraftId: 'ac-hva',
        detectedAt: '2026-09-15',
        sector: '',
        phase: 'enroute',
        incidentType: 'maintenance',
        severity: 'mel',
        summary: '',
        ataCode: 'ATA-29',
        instrumentReading: '',
        caution: '',
        description: '',
        crewAction: '',
        evidenceName: null,
        declared: false,
        status: 'draft',
      }),
    );
    expect(draft.folio).toMatch(/^INC-\d{4}-\d{4}$/);
    const submitted = await firstValueFrom(
      create.execute({
        executionId: 'execution-dispatch-ready',
        missionId: 'mission-1',
        aircraftId: 'ac-hva',
        detectedAt: '2026-09-15',
        sector: '',
        phase: 'enroute',
        incidentType: 'maintenance',
        severity: 'mel',
        summary: 'Presión hidráulica irregular',
        ataCode: 'ATA-29',
        instrumentReading: '',
        caution: '',
        description: 'Fluctuación sostenida durante viraje.',
        crewAction: '',
        evidenceName: null,
        declared: true,
        status: 'submitted',
      }),
    );
    expect(submitted.status).toBe('submitted');
  });

  it('lista incidencias registradas y permite filtrar por fecha', async () => {
    const board = await firstValueFrom(
      new GetFlightIncidentBoard(new MockFlightIncidentRepository(), new MockAdminCatalogRepository()).execute(),
    );
    expect(board.rows.length).toBeGreaterThanOrEqual(4);
    expect(board.aircraftOptions.some((item) => item.label === 'EC-HVA')).toBe(true);
    expect(board.rows.some((row) => row.aircraftRegistration === 'EC-HVD' && row.severity === 'aog')).toBe(true);
    const today = board.rows.find((row) => row.severity === 'aog');
    expect(today).toBeTruthy();
    const inRange = board.rows.filter((row) => isIncidentInDateRange(row.detectedAt, today?.occurredOn ?? '', today?.occurredOn ?? ''));
    expect(inRange.length).toBeGreaterThanOrEqual(3);
    expect(inRange.every((row) => row.occurredOn === today?.occurredOn)).toBe(true);
    expect(matchesIncidentBucket('aog', 'critical')).toBe(true);
    expect(matchesIncidentBucket('mel', 'critical')).toBe(false);
    expect(matchesIncidentBucket('routine', 'closed')).toBe(true);
    expect(board.rows.some((row) => row.lifecycle === 'registered')).toBe(true);
    expect(board.rows.some((row) => row.lifecycle === 'resolved')).toBe(true);
    expect(board.rows.some((row) => row.lifecycle === 'deferred')).toBe(true);
  });

  it('registra la acción tomada sobre una incidencia', async () => {
    const repo = new MockFlightIncidentRepository();
    const listed = await firstValueFrom(repo.list());
    const target = listed.find((item) => item.id === 'inc-0421');
    expect(target).toBeTruthy();
    const loaded = await firstValueFrom(new GetFlightIncident(repo).execute('inc-0421'));
    expect(loaded.folio).toBe(target?.folio);
    const updated = await firstValueFrom(
      new TakeFlightIncidentAction(repo).execute('inc-0421', {
        crewAction: 'Cambio de conjunto de mandos y prueba en tierra.',
        workshopNote: 'Holgura corregida.',
        outcome: 'resolved',
      }),
    );
    expect(updated.severity).toBe('routine');
    expect(updated.crewAction).toContain('Cambio de conjunto');
    expect(updated.workshopNote).toBe('Holgura corregida.');
  });
});

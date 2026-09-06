import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { FLIGHT_INCIDENT_COPY } from '../../../constants/flight-incident.copy.constants';
import { FlightIncidentBoardPage } from './flight-incident-board.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

const sofiaPilot: OperationalContext = {
  userId: 'usr-sofia-vidal',
  displayName: 'Sofía Vidal Romero',
  roleCode: 'PILOT',
  assignedUnitId: 'unit-norte',
  assignedSquadronId: 'sq-alfa',
  unitId: 'unit-norte',
  squadronId: 'sq-alfa',
  coversAllSquadrons: false,
};

async function waitReady(fixture: ComponentFixture<FlightIncidentBoardPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('FlightIncidentBoardPage', () => {
  it('muestra incidencias registradas, filtro de fecha y acciones de consulta', async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FlightIncidentBoardPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext(sofiaPilot);

    const fixture = TestBed.createComponent(FlightIncidentBoardPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.loadState()).toBe('ready');
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.boardLogTitle);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.boardReport);
    expect(root.textContent).not.toContain('Operaciones de vuelo');
    expect(root.textContent).not.toContain('Mantenimiento y flota');
    expect(root.querySelector('#inc-board-from')).not.toBeNull();
    expect(root.querySelector('#inc-board-to')).not.toBeNull();
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.boardViewIncident);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.boardViewAction);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.boardTakeAction);
    expect(fixture.componentInstance.columns.every((column) => column.id !== 'view')).toBe(true);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.boardState);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.boardLifecycles.registered);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.boardLifecycles.resolved);
    expect(root.textContent).toContain('EC-HVD');
    expect(root.textContent).toMatch(/INC-\d{4}-0421/);

    const today = fixture.componentInstance.scopedRows().find((row) => row.severity === 'aog')?.occurredOn ?? '';
    fixture.componentInstance.from.setValue(today);
    fixture.componentInstance.to.setValue(today);
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredRows().every((row) => row.occurredOn === today)).toBe(true);
    expect(fixture.componentInstance.filteredRows().length).toBeGreaterThan(0);
  });
});

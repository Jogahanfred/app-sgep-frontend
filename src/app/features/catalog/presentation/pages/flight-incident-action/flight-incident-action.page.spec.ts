import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { FLIGHT_INCIDENT_COPY } from '../../../constants/flight-incident.copy.constants';
import { FlightIncidentActionPage } from './flight-incident-action.page';

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

async function waitReady(fixture: ComponentFixture<FlightIncidentActionPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('FlightIncidentActionPage', () => {
  it('carga el formulario para tomar acción sobre una incidencia', async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FlightIncidentActionPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'inc-0421' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext(sofiaPilot);

    const fixture = TestBed.createComponent(FlightIncidentActionPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.loadState()).toBe('ready');
    expect(root.querySelector('h1')?.textContent).toContain(FLIGHT_INCIDENT_COPY.actionTitle);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.boardAction);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.actionOutcome);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.actionSave);
  });
});

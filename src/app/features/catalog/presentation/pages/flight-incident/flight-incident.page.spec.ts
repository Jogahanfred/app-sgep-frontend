import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import type { OperationalContext } from '@core/domain/entities/operational-context';
import { FLIGHT_INCIDENT_COPY } from '../../../constants/flight-incident.copy.constants';
import { FlightIncidentPage } from './flight-incident.page';

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

async function waitReady(fixture: ComponentFixture<FlightIncidentPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('FlightIncidentPage', () => {
  it('carga el formulario de incidencia con título en rojo y acciones de despacho', async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FlightIncidentPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'execution-dispatch-ready' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext(sofiaPilot);

    const fixture = TestBed.createComponent(FlightIncidentPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.loadState()).toBe('ready');
    expect(root.querySelector('h1')?.textContent).toContain(FLIGHT_INCIDENT_COPY.pageTitle);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.sectionOps);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.sectionOpsLead);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.sectionClass);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.sectionDetail);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.sectionCrew);
    expect(root.querySelector('.fi__card-head')).not.toBeNull();
    expect(root.querySelector('.fi__choice')).not.toBeNull();
    expect(root.querySelector('.fi__sev-card')).not.toBeNull();
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.submit);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.saveDraft);
    expect(root.querySelector('ui-select')).not.toBeNull();
    expect(root.querySelector('ui-textarea')).not.toBeNull();
    expect(root.textContent).not.toContain(FLIGHT_INCIDENT_COPY.back);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.backToList);
  });

  it('desde la hoja de misión muestra volver a la hoja operativa', async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FlightIncidentPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'execution-dispatch-ready' }),
              queryParamMap: convertToParamMap({ origen: 'mision' }),
            },
          },
        },
      ],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext(sofiaPilot);

    const fixture = TestBed.createComponent(FlightIncidentPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.loadState()).toBe('ready');
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.back);
    expect(root.textContent).not.toContain(FLIGHT_INCIDENT_COPY.backToList);
  });

  it('consulta una incidencia registrada en solo lectura', async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FlightIncidentPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'inc-0421' }),
              queryParamMap: convertToParamMap({}),
              data: { mode: 'view' },
            },
          },
        },
      ],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext(sofiaPilot);

    const fixture = TestBed.createComponent(FlightIncidentPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.loadState()).toBe('ready');
    expect(fixture.componentInstance.readOnly).toBe(true);
    expect(root.textContent).toContain(FLIGHT_INCIDENT_COPY.viewBadge);
    expect(fixture.componentInstance.form.controls.summary.value).toContain('Vibración anómala');
    expect(fixture.componentInstance.form.disabled).toBe(true);
    expect(root.textContent).not.toContain(FLIGHT_INCIDENT_COPY.submit);
    expect(root.textContent).not.toContain(FLIGHT_INCIDENT_COPY.saveDraft);
  });
});

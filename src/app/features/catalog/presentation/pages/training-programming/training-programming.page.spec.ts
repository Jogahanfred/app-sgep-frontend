import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { TRAINING_PROGRAMMING_COPY } from '../../../constants/training-programming.copy.constants';
import { trainingAssignmentStatusLabel } from './training-programming.labels';
import { TrainingProgrammingPage } from './training-programming.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitMembers(fixture: ComponentFixture<TrainingProgrammingPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.groups().length === 0 && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('training programming labels', () => {
  it('translates the assignment workflow', () => {
    expect(trainingAssignmentStatusLabel('in-progress')).toBe('En curso');
  });
});

function stubDialog(): void {
  if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
    };
  }
}

describe('TrainingProgrammingPage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [TrainingProgrammingPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext({
      userId: 'usr-elena-martin',
      displayName: 'Elena Martín Ruiz',
      roleCode: 'ADSYS',
      assignedUnitId: null,
      assignedSquadronId: null,
      unitId: 'unit-norte',
      squadronId: 'sq-alfa',
      coversAllSquadrons: false,
    });
  });

  it('matricula por promoción y muestra a los participantes', async () => {
    const fixture = TestBed.createComponent(TrainingProgrammingPage);
    await waitMembers(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(TRAINING_PROGRAMMING_COPY.groupTab);
    expect(text).toContain(TRAINING_PROGRAMMING_COPY.individualTab);
    expect(text).toContain(TRAINING_PROGRAMMING_COPY.createGroup);
    expect(text).toContain('Promoción Alfa 2025');
    expect(text).toContain(TRAINING_PROGRAMMING_COPY.participants);
    expect(text).toContain('Sofía Vidal Romero');
    expect(text).not.toContain('Alumnos matriculados');
    expect(text).not.toContain('Programación y asignación de misiones');
  });

  it('abre un modal con los datos de las personas inscritas', async () => {
    const fixture = TestBed.createComponent(TrainingProgrammingPage);
    await waitMembers(fixture);
    const item = fixture.componentInstance.visibleGroups()[0];
    expect(item).toBeTruthy();
    fixture.componentInstance.viewParticipants(item);
    fixture.detectChanges();
    const text = [...(fixture.nativeElement as HTMLElement).querySelectorAll('app-modal')]
      .map((node) => node.textContent ?? '')
      .find((content) => content.includes(TRAINING_PROGRAMMING_COPY.participantsModalTitle));
    expect(text).toContain('Sofía Vidal Romero');
    expect(text).toContain('77812045B');
    expect(text).toContain('sofia.vidal@alumno.siga.demo');
  });

  it('abre la lista de alumno al volver con lista=alumno', async () => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    localStorage.clear();
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [TrainingProgrammingPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ lista: 'alumno' }) },
            queryParamMap: of(convertToParamMap({ lista: 'alumno' })),
          },
        },
      ],
    }).compileComponents();
    TestBed.inject(ClientSession).confirmContext({
      userId: 'usr-elena-martin',
      displayName: 'Elena Martín Ruiz',
      roleCode: 'ADSYS',
      assignedUnitId: null,
      assignedSquadronId: null,
      unitId: 'unit-norte',
      squadronId: 'sq-alfa',
      coversAllSquadrons: false,
    });
    const fixture = TestBed.createComponent(TrainingProgrammingPage);
    fixture.detectChanges();
    expect(fixture.componentInstance.tab()).toBe('individual');
  });
});

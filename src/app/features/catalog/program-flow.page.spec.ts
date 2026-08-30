import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ProgramFlowPage } from './program-flow.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

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

async function waitReady(fixture: ComponentFixture<ProgramFlowPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

function navButtons(root: HTMLElement): { back?: HTMLButtonElement; next?: HTMLButtonElement } {
  const buttons = [...root.querySelectorAll('button')];
  return {
    back: buttons.find((node) => (node.textContent ?? '').includes('Atrás')),
    next: buttons.find((node) => (node.textContent ?? '').includes('Siguiente')),
  };
}

describe('ProgramFlowPage', () => {
  beforeEach(() => {
    sessionStorage.setItem('siga-flow-tour', JSON.stringify({ 'prg-ppl': 'completed' }));
    TestBed.resetTestingModule();
  });

  it('coloca el cuadro en fase, subfase y entra misión a misión', async () => {
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [ProgramFlowPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'prg-ppl' }), data: {} } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramFlowPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';

    expect(text).toContain('Flujo de Piloto privado · ala fija');
    expect(text).toContain('Solo consulta');
    expect(text).toContain('Inicio');
    expect(page.depth()).toBe('start');
    expect(root.querySelector('.flow__on')).toBeNull();
    expect(navButtons(root).back?.disabled).toBe(true);
    expect(navButtons(root).next?.disabled).toBe(false);
    expect(text).not.toContain('Añadir');
    expect(text).not.toContain('Guardar');
    expect(text).not.toContain('Editar fase');
    expect(root.querySelector('input')).toBeNull();
    expect(root.querySelector('form')).toBeNull();

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('phase');
    expect(page.currentPhase()?.name).toBe('TEO · Teoría en aula');
    expect(root.querySelector('.flow__on')?.textContent).toContain('TEO · Teoría en aula');
    expect(root.querySelector('.flow__on')?.textContent).toContain('Cuadro en la fase');
    expect(root.textContent).toContain('AULA · Aula');
    expect(root.textContent).toContain('Ver maniobras');
    expect(root.textContent).not.toContain('DUAL · Dual');
    expect(root.textContent).not.toContain('Circuito corto');
    expect(root.textContent).not.toContain('TOFF · Despegue');
    expect(root.textContent).not.toContain('Fin del programa');

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('lesson');
    expect(page.currentLesson()?.name).toBe('AULA · Aula');
    expect(root.querySelector('.flow__on')?.textContent).toContain('Cuadro en la subfase');
    expect(root.textContent).toContain('0 misiones');

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('phase');
    expect(page.currentPhase()?.name).toBe('BAS · Vuelo básico');
    expect(root.querySelector('.flow__on')?.textContent).toContain('Cuadro en la fase');
    expect(root.textContent).toContain('BRF · Briefing');
    expect(root.textContent).toContain('DUAL · Dual');
    expect(root.textContent).not.toContain('Circuito corto');

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('lesson');
    expect(page.currentLesson()?.name).toBe('BRF · Briefing');

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('mission');
    expect(page.currentMission()?.name).toBe('LOC · Misión local');
    expect(root.querySelector('.flow__task')?.textContent).toContain('Dentro de la misión');
    expect(root.textContent).toContain('Misión 1 de 1');
    expect(root.textContent).not.toContain('Circuito corto');
    expect(root.textContent).not.toContain('TOFF · Despegue');

    const briefing = page.currentLesson();
    expect(briefing?.hasManeuvers).toBe(true);
    page.openManeuvers(briefing!);
    fixture.detectChanges();
    expect(root.textContent).toContain('Maniobras · BRF · Briefing');
    expect(root.textContent).toContain('TOFF · Despegue');
    expect(root.textContent).toContain('LAND · Aterrizaje');
    page.closeManeuvers();
    fixture.detectChanges();
    expect(root.querySelector('.flow__phase')?.textContent).not.toContain('TOFF · Despegue');

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('lesson');
    expect(page.currentLesson()?.name).toBe('DUAL · Dual');

    page.goNext();
    fixture.detectChanges();
    expect(page.currentMission()?.name).toBe('LOC · Misión local');
    expect(root.textContent).toContain('Misión 1 de 3');

    page.goNext();
    fixture.detectChanges();
    expect(page.currentMission()?.name).toBe('Circuito corto');
    expect(root.textContent).toContain('Misión 2 de 3');

    page.goNext();
    fixture.detectChanges();
    expect(page.currentMission()?.name).toBe('Circuito largo');
    expect(root.textContent).toContain('Misión 3 de 3');

    page.goTo(4);
    fixture.detectChanges();
    expect(page.depth()).toBe('phase');
    expect(page.currentPhase()?.name).toContain('CHK');
    page.goNext();
    page.goNext();
    fixture.detectChanges();
    expect(page.isLast()).toBe(true);
    expect(root.querySelector('.flow__phase')?.textContent).toContain('Fin del programa');
    expect(navButtons(root).next?.disabled).toBe(true);
  });

  it('recorre el tour sobre la fase, la subfase, cada misión real y Ver maniobras', async () => {
    sessionStorage.clear();
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [ProgramFlowPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'prg-ppl' }), data: {} } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramFlowPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;

    expect(page.tourOpen()).toBe(true);
    expect(page.tourStep()?.kind).toBe('intro');
    expect(root.textContent).toContain('Comenzar');
    expect(root.textContent).toContain('Omitir');
    expect(page.tourSteps().filter((step) => step.kind === 'mission').length).toBeGreaterThan(0);

    page.tourNext();
    fixture.detectChanges();
    expect(page.tourStep()?.kind).toBe('phase');
    expect(page.depth()).toBe('phase');
    expect(root.querySelector('[data-tour="phase"]')).not.toBeNull();
    expect(root.querySelector('ui-guided-tour')?.textContent).toContain('Una fase es una etapa');

    page.tourNext();
    fixture.detectChanges();
    expect(page.tourStep()?.kind).toBe('lesson');
    expect(page.depth()).toBe('lesson');
    expect(root.querySelector('[data-tour="lesson"]')).not.toBeNull();

    const missionSteps = page.tourSteps().filter((step) => step.kind === 'mission');
    for (const step of missionSteps) {
      page.tourNext();
      fixture.detectChanges();
      expect(page.tourStep()?.kind).toBe('mission');
      expect(page.currentMission()?.name).toBe(step.title);
      expect(root.querySelector('[data-tour="mission"]')).not.toBeNull();
    }

    page.tourNext();
    fixture.detectChanges();
    expect(page.tourStep()?.kind).toBe('maneuvers');
    expect(root.querySelector('[data-tour="maneuvers"]')).not.toBeNull();
    expect(root.querySelector('ui-guided-tour')?.textContent).toContain('consultar las maniobras');
    expect(root.querySelector('ui-guided-tour')?.textContent).toContain('Finalizar');

    page.tourNext();
    fixture.detectChanges();
    expect(page.tourStep()?.kind).toBe('finish');
    expect(root.textContent).toContain('Programa → Fase → Subfase → Misiones → Maniobras');
    page.finishTour();
    fixture.detectChanges();
    expect(page.tourOpen()).toBe(false);
    expect(JSON.parse(sessionStorage.getItem('siga-flow-tour') ?? '{}')['prg-ppl']).toBe('completed');
  });
});

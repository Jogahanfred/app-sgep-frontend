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

function headerCells(table: HTMLTableElement): string[] {
  return [...table.querySelectorAll('thead th')].map((node) => (node.textContent ?? '').trim());
}

function rowLabels(table: HTMLTableElement): string[] {
  return [...table.querySelectorAll('tbody th')].map((node) => (node.textContent ?? '').trim());
}

describe('ProgramFlowPage', () => {
  beforeEach(() => {
    sessionStorage.setItem('siga-flow-tour', JSON.stringify({ 'prg-ppl': 'completed' }));
    TestBed.resetTestingModule();
  });

  it('marca FASE 1 y, tras la subfase, muestra la matriz misión × maniobra', async () => {
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
    expect(text).not.toContain('Cuadro en la fase');
    expect(root.querySelector('input')).toBeNull();
    expect(root.querySelector('form')).toBeNull();

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('phase');
    expect(page.currentPhase()?.name).toBe('TEO · Teoría en aula');
    expect(root.querySelector('.flow__on')?.textContent).toContain('TEO · Teoría en aula');
    expect(root.querySelector('.flow__on')?.textContent).toContain('FASE 1');
    expect(root.querySelector('.flow__on')?.textContent).not.toContain('Cuadro en la fase');
    expect(root.textContent).toContain('AULA · Aula');
    expect(root.textContent).not.toContain('Ver maniobras');
    expect(root.textContent).not.toContain('DUAL · Dual');
    expect(root.textContent).not.toContain('Circuito corto');
    expect(root.textContent).not.toContain('TOFF · Despegue');
    expect(root.textContent).not.toContain('Fin del programa');

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('lesson');
    expect(page.currentLesson()?.name).toBe('AULA · Aula');
    expect(root.querySelector('.flow__on')?.textContent).toContain('SUBFASE 1');
    expect(root.textContent).toContain('0 misiones');
    expect(root.querySelector('[data-tour="matrix"]')).toBeNull();

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('matrix');
    expect(root.querySelector('[data-tour="matrix"]')?.textContent).toContain(
      'Esta subfase no tiene misiones ni maniobras.',
    );

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('phase');
    expect(page.currentPhase()?.name).toBe('BAS · Vuelo básico');
    expect(root.querySelector('.flow__on')?.textContent).toContain('FASE 2');
    expect(root.textContent).toContain('BRF · Briefing');
    expect(root.textContent).toContain('DUAL · Dual');
    expect(root.textContent).not.toContain('Circuito corto');

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('lesson');
    expect(page.currentLesson()?.name).toBe('BRF · Briefing');

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('matrix');
    const briefing = root.querySelector('[data-tour="matrix"] table') as HTMLTableElement | null;
    expect(briefing).not.toBeNull();
    expect(headerCells(briefing!)).toEqual(['Maniobras', 'LOC · Misión local']);
    expect(rowLabels(briefing!)).toEqual(['TOFF · Despegue', 'LAND · Aterrizaje']);
    expect([...briefing!.querySelectorAll('td')].map((cell) => cell.textContent?.trim())).toEqual(['X', 'X']);
    expect(root.textContent).toContain('Matriz · 1 × 2');
    expect(root.textContent).not.toContain('Ver maniobras');
    expect(root.textContent).not.toContain('Circuito corto');

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('lesson');
    expect(page.currentLesson()?.name).toBe('DUAL · Dual');

    page.goNext();
    fixture.detectChanges();
    expect(page.depth()).toBe('matrix');
    const dual = root.querySelector('[data-tour="matrix"] table') as HTMLTableElement | null;
    expect(dual).not.toBeNull();
    expect(headerCells(dual!)).toEqual(['Maniobras', 'LOC · Misión local', 'Circuito corto', 'Circuito largo']);
    expect(rowLabels(dual!)).toEqual(['TOFF · Despegue', 'LAND · Aterrizaje']);
    expect([...dual!.querySelectorAll('td')].every((cell) => cell.textContent?.trim() === 'X')).toBe(true);
    expect(dual!.querySelectorAll('td')).toHaveLength(6);

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

  it('recorre el tour sobre la fase, la subfase y la matriz', async () => {
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
    expect(root.textContent).not.toContain('Omitir');
    expect(page.tourSteps().filter((step) => step.kind === 'matrix')).toHaveLength(1);
    expect(page.tourSteps().some((step) => step.kind === 'mission' as never)).toBe(false);

    page.tourNext();
    fixture.detectChanges();
    expect(page.tourStep()?.kind).toBe('phase');
    expect(page.tourStep()?.title).toBe('FASE 2');
    expect(page.depth()).toBe('phase');
    expect(root.querySelector('[data-tour="phase"]')).not.toBeNull();
    expect(root.querySelector('ui-guided-tour')?.textContent).toContain('Una fase es una etapa');
    expect(root.querySelector('ui-guided-tour')?.textContent).toContain('FASE 2');

    page.tourNext();
    fixture.detectChanges();
    expect(page.tourStep()?.kind).toBe('lesson');
    expect(page.depth()).toBe('lesson');
    expect(root.querySelector('[data-tour="lesson"]')).not.toBeNull();

    page.tourNext();
    fixture.detectChanges();
    expect(page.tourStep()?.kind).toBe('matrix');
    expect(page.depth()).toBe('matrix');
    expect(root.querySelector('[data-tour="matrix"]')).not.toBeNull();
    expect(root.querySelector('[data-tour="matrix"] caption')?.textContent).toContain('Misiones');
    expect(root.querySelector('[data-tour="matrix"] thead')?.textContent).toContain('Maniobras');
    expect(root.querySelector('[data-tour="matrix"] thead')?.textContent).toContain('LOC · Misión local');
    expect(root.querySelector('[data-tour="matrix"] tbody')?.textContent).toContain('TOFF · Despegue');
    expect(root.querySelector('[data-tour="matrix"] td')?.textContent).toContain('X');
    expect(root.querySelector('ui-guided-tour')?.textContent).toContain('eje X');
    expect(root.querySelector('ui-guided-tour')?.textContent).toContain('eje Y');
    expect(root.querySelector('ui-guided-tour')?.textContent).toContain('Finalizar');

    page.tourNext();
    fixture.detectChanges();
    expect(page.tourStep()?.kind).toBe('finish');
    expect(root.textContent).toContain('Programa → Fase → Subfase → Matriz de misiones y maniobras');
    page.finishTour();
    fixture.detectChanges();
    expect(page.tourOpen()).toBe(false);
    expect(JSON.parse(sessionStorage.getItem('siga-flow-tour') ?? '{}')['prg-ppl']).toBe('completed');
  });
});

import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ProgramStudioPage } from './program-studio.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<ProgramStudioPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

function routeSnapshot(id: string | null, mode?: string) {
  return {
    snapshot: {
      paramMap: convertToParamMap(id ? { id } : {}),
      data: mode ? { mode } : {},
    },
  };
}

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

describe('ProgramStudioPage', () => {
  it('carga el itinerario PPL como un plan de estudios', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramStudioPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS, { provide: ActivatedRoute, useValue: routeSnapshot('prg-ppl', 'edit') }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStudioPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Diseñar plan de estudios');
    expect(text).toContain('Itinerario');
    expect(text).toContain('Teoría en aula');
    expect(text).toContain('Vuelo básico');
    expect(text).toContain('Aula');
    expect(text).toContain('Dual');
    expect(text).toContain('Manual');
    expect(text).toContain('Automático');
    expect(text).toContain('C1');
    expect(text).toContain('C17');
    expect(text).toContain('Añadir fase al itinerario');
    expect(text).toContain('Editar fase');
    expect(text).not.toContain('Banco de fases');
    expect(text).not.toContain('Banco de subfases');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/catalogo/banco-fases"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/catalogo/banco-subfases"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('ui-select[id^="phase-bank-"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('[id^="sub-bank-"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('ui-table')).toBeNull();
  });

  it('permite empezar un programa vacío y añadir la primera fase', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramStudioPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS, { provide: ActivatedRoute, useValue: routeSnapshot(null) }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStudioPage);
    await waitReady(fixture);
    expect(fixture.componentInstance.phases().length).toBe(0);
    fixture.componentInstance.addPhase();
    fixture.detectChanges();
    expect(fixture.componentInstance.phases().length).toBe(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Fase 1');
  });

  it('permite editar la fase del programa y cambiarla por otra que aún no usa', async () => {
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [ProgramStudioPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS, { provide: ActivatedRoute, useValue: routeSnapshot('prg-ppl', 'edit') }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStudioPage);
    await waitReady(fixture);
    const firstKey = fixture.componentInstance.phases()[0].key;
    fixture.componentInstance.openPhaseBankPicker(firstKey);
    fixture.detectChanges();
    const modal = (fixture.nativeElement as HTMLElement).querySelector('dialog, app-modal');
    const modalText = modal?.textContent ?? '';
    expect(modalText).toContain('Editar fase');
    expect(modalText).toContain('TEO · Teoría en aula');
    expect(modalText).toContain('En el programa');
    expect(modalText).toContain('IFR · Instrumental');
    expect(modalText).not.toContain('BAS · Vuelo básico');
    fixture.componentInstance.pickPhaseBank('pb-ifr');
    fixture.detectChanges();
    expect(fixture.componentInstance.phases()[0].phaseBankId).toBe('pb-ifr');
    expect(fixture.componentInstance.phaseBankOpen()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('IFR · Instrumental');
  });
});

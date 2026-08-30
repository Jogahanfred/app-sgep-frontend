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
    expect(text).toContain('Subfase 1');
    expect(text).toContain('Subfase 2');
    expect(text).toContain('Las sesiones que vuela o practica el alumno');
    expect(text).toContain('Los ejercicios que se trabajan o evalúan');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('ui-assign-block').length).toBeGreaterThan(1);
    expect(text).toContain('Añadir');
    const chips = (fixture.nativeElement as HTMLElement).querySelector('.chips') as HTMLElement | null;
    expect(chips).not.toBeNull();
    expect(getComputedStyle(chips!).justifyContent).toBe('center');
    const addMission = (fixture.nativeElement as HTMLElement).querySelector('.ab__title-row app-button');
    expect(addMission?.textContent).toContain('Añadir');
    expect(addMission?.querySelector('.btn--xs')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.ab__body app-button')).toBeNull();
    expect(text).toContain('C1');
    expect(text).toContain('C17');
    expect((fixture.nativeElement as HTMLElement).querySelector('input[id^="ms-"]')).toBeNull();
    expect(text).toContain('Añadir fase al itinerario');
    expect(text).toContain('Editar fase');
    expect(text).not.toContain('Banco de fases');
    expect(text).not.toContain('Banco de subfases');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/catalogo/banco-fases"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/catalogo/banco-subfases"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('ui-select[id^="phase-bank-"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('[id^="sub-bank-"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.path ui-table')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('ui-input input[id^="hours-"]')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('label.lesson__hours')).toBeNull();
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
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Subfase 1');
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
    expect(modal?.querySelector('ui-table')).not.toBeNull();
    expect(modalText).toContain('Editar fase');
    expect(modalText).toContain('TEO');
    expect(modalText).toContain('Teoría en aula');
    expect(modalText).toContain('En el programa');
    expect(modalText).toContain('IFR');
    expect(modalText).toContain('Instrumental');
    expect(modalText).toContain('Mostrando 1 - 4 de 6');
    expect(modalText).not.toContain('Vuelo solo');
    expect(modalText).not.toContain('Prueba de pericia');
    fixture.componentInstance.phaseBankSearch.setValue('BAS');
    fixture.detectChanges();
    expect((modal?.textContent ?? '')).toContain('Vuelo básico');
    expect((modal?.textContent ?? '')).not.toContain('Instrumental');
    fixture.componentInstance.pickerSelectedId.set('pb-ifr');
    fixture.componentInstance.applyPickerPhase();
    fixture.detectChanges();
    expect(fixture.componentInstance.phases()[0].phaseBankId).toBe('pb-ifr');
    expect(fixture.componentInstance.phaseBankOpen()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('IFR · Instrumental');
  });

  it('abre las misiones con la lista generada y un botón añadir', async () => {
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [ProgramStudioPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS, { provide: ActivatedRoute, useValue: routeSnapshot('prg-ppl', 'edit') }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStudioPage);
    await waitReady(fixture);
    const dual = fixture.componentInstance.phases()[1].subphases[1];
    fixture.componentInstance.openMissionPicker(fixture.componentInstance.phases()[1].key, dual.key);
    fixture.detectChanges();
    const modal =
      (fixture.nativeElement as HTMLElement).querySelector('dialog[open]') ??
      [...(fixture.nativeElement as HTMLElement).querySelectorAll('app-modal')].find((item) =>
        (item.textContent ?? '').includes('Misiones generadas'),
      );
    let modalText = modal?.textContent ?? '';
    expect(modal?.querySelector('ui-table')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('dialog.modal--xl')).not.toBeNull();
    expect(modalText).toContain('Misiones generadas');
    expect(modalText).toContain('LOC · Misión local');
    expect(modalText).toContain('Circuito corto');
    expect(modalText).toContain('Añadir');
    expect(modalText).not.toContain('Catálogo');
    expect(modalText).not.toContain('Crear en automático');
    fixture.componentInstance.startAddingMissions();
    fixture.detectChanges();
    modalText = modal?.textContent ?? '';
    expect(modalText).toContain('Manual');
    expect(modalText).toContain('Automático');
    expect(modal?.querySelector('#pick-mision-buscar')).toBeNull();
    fixture.componentInstance.draftMissionName.update((map) => ({ ...map, [dual.key]: 'Circuito bajo' }));
    fixture.componentInstance.addCustomMission(fixture.componentInstance.phases()[1].key, dual.key);
    fixture.detectChanges();
    expect(fixture.componentInstance.phases()[1].subphases[1].customMissionNames).toContain('Circuito bajo');
    expect(fixture.componentInstance.generatedMissions().some((item) => item.label === 'Circuito bajo')).toBe(true);
    expect(fixture.componentInstance.missionAdding()).toBe(false);
  });
});

import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS } from './catalog-form';
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
    const addMission = (fixture.nativeElement as HTMLElement).querySelector('.ab__bar app-button');
    expect(addMission?.textContent).toContain('Añadir');
    expect(addMission?.querySelector('.btn--xs')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.ab__body app-button')).toBeNull();
    expect(text).toContain('C1');
    expect(text).toContain('C8');
    expect(text).toContain('C17');
    expect(text).not.toMatch(/C1, C2, C3, C4 … C17/);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.chips ui-chip').length).toBeGreaterThanOrEqual(17);
    expect(text).toContain('TOFF · Despegue');
    expect(text).toContain('LAND · Aterrizaje');
    const orderBtns = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.ab__bar app-button')].filter((node) =>
      (node.textContent ?? '').includes('Ver orden'),
    );
    expect(orderBtns.length).toBeGreaterThan(0);
    expect(orderBtns.some((node) => !node.querySelector('button')?.disabled)).toBe(true);
    expect(orderBtns.some((node) => !!node.querySelector('button')?.disabled)).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('input[id^="ms-"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('input[id^="mn-"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('fieldset.picks')).toBeNull();
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
    expect(text).toContain('Guardar programa');
    expect(text).not.toContain('Guardar plan');
    expect(text).toContain('Póster del programa');
    expect(text).toContain('Cambiar póster');
    expect((fixture.nativeElement as HTMLElement).querySelector('ui-poster-field input[type="file"]')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('ui-poster-field img')?.getAttribute('src')).toBe(
      '/programs/ppl.jpg',
    );
  });

  it('al guardar muestra el loading y vuelve a la lista', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramStudioPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS, { provide: ActivatedRoute, useValue: routeSnapshot('prg-ppl', 'edit') }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStudioPage);
    await waitReady(fixture);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const success = vi.spyOn(TestBed.inject(ToastService), 'success');

    vi.useFakeTimers();
    try {
      const pending = fixture.componentInstance.save();
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      expect(fixture.componentInstance.creating()).toBe(true);
      expect(root.textContent).toContain('Guardando el programa');
      expect(root.querySelector('form')).toBeNull();
      expect(root.querySelector('ui-loading.ap__loading')).not.toBeNull();
      await vi.advanceTimersByTimeAsync(CATALOG_CREATE_HOLD_MS);
      await pending;
    } finally {
      vi.useRealTimers();
    }

    expect(success).toHaveBeenCalledWith('Programa guardado', 'El programa ya está en la academia.');
    expect(navigate).toHaveBeenCalledWith('/catalogo/programas');
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
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Subir imagen o póster');
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
    const mode = modal?.querySelector('ui-segmented-control');
    expect(mode).not.toBeNull();
    const pills = mode?.querySelectorAll('.sp__btn') ?? [];
    expect(pills.length).toBe(2);
    expect(pills[0].classList.contains('sp__btn--on')).toBe(true);
    expect(pills[1].classList.contains('sp__btn--on')).toBe(false);
    expect(modal?.querySelector('#pick-mision-buscar')).toBeNull();
    fixture.componentInstance.draftMissionName.update((map) => ({ ...map, [dual.key]: 'Circuito bajo' }));
    fixture.componentInstance.addCustomMission(fixture.componentInstance.phases()[1].key, dual.key);
    fixture.detectChanges();
    expect(fixture.componentInstance.phases()[1].subphases[1].customMissionNames).toContain('Circuito bajo');
    expect(fixture.componentInstance.generatedMissions().some((item) => item.label === 'Circuito bajo')).toBe(true);
    expect(fixture.componentInstance.missionAdding()).toBe(false);
  });

  it('añade maniobras desde el catálogo y las muestra como chips', async () => {
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [ProgramStudioPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS, { provide: ActivatedRoute, useValue: routeSnapshot('prg-ppl', 'edit') }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStudioPage);
    await waitReady(fixture);
    const phase = fixture.componentInstance.phases()[1];
    const dual = phase.subphases[1];
    fixture.componentInstance.openManeuverPicker(phase.key, dual.key);
    fixture.detectChanges();
    const modal =
      [...(fixture.nativeElement as HTMLElement).querySelectorAll('app-modal')].find((item) =>
        (item.textContent ?? '').includes('Elige una maniobra del catálogo'),
      ) ?? null;
    expect(modal).not.toBeNull();
    expect(modal?.querySelector('dialog.modal--xl')).not.toBeNull();
    expect(modal?.querySelector('ui-table')).not.toBeNull();
    expect(modal?.querySelector('ui-pick-list')).toBeNull();
    expect(modal?.textContent).toContain('TOFF');
    expect(modal?.textContent).toContain('HOLD');
    expect(modal?.textContent).toContain('En la subfase');
    expect(fixture.componentInstance.maneuverCheckedIds()).toEqual(['man-toff', 'man-land']);
    expect(fixture.componentInstance.maneuverOperationOrder()).toEqual(['op-vfr']);
    expect(fixture.componentInstance.maneuverAssignment()).toEqual({
      'man-toff': 'op-vfr',
      'man-land': 'op-vfr',
    });
    expect(modal?.querySelector('.btn--xs')?.textContent).toContain('Añadir');
    expect(modal?.textContent).toContain('Agrupar por operaciones');
    const groupBtn = [...(modal?.querySelectorAll('button') ?? [])].find((node) =>
      (node.textContent ?? '').includes('Agrupar por operaciones'),
    ) as HTMLButtonElement | undefined;
    expect(groupBtn?.disabled).toBe(false);
    fixture.componentInstance.maneuverCheckedIds.set(['man-toff', 'man-land', 'man-hold', 'man-stall']);
    fixture.detectChanges();
    const groupBtnOn = [...(modal?.querySelectorAll('button') ?? [])].find((node) =>
      (node.textContent ?? '').includes('Agrupar por operaciones'),
    ) as HTMLButtonElement | undefined;
    expect(groupBtnOn?.disabled).toBe(false);
    fixture.componentInstance.addManeuverFromCatalog('man-hold');
    fixture.detectChanges();
    expect(fixture.componentInstance.phases()[1].subphases[1].maneuverIds).toContain('man-hold');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('HOLD · Espera');
    fixture.componentInstance.showManeuverGroups();
    fixture.detectChanges();
    expect(modal?.textContent).toContain('Por operaciones');
    expect(modal?.querySelector('ui-operation-board')).not.toBeNull();
    expect(modal?.querySelector('ui-operation-board table')).toBeNull();
    expect(modal?.textContent).toContain('Buscar operación');
    expect(modal?.querySelector('ui-operation-board ui-select')).not.toBeNull();
    expect(modal?.querySelectorAll('ui-operation-board [data-op]').length).toBe(1);
    expect(modal?.textContent).toContain('Vuelo visual');
    expect(modal?.textContent).toContain('HOLD · Espera');
    expect(modal?.textContent).toContain('STALL · Pérdida');
    expect(modal?.querySelector('ui-operation-board')?.textContent).not.toContain('Añadir');
    expect(modal?.querySelector('ui-operation-board [data-man="man-hold"]')?.textContent).toContain('HOLD');
    expect(modal?.querySelector('ui-operation-board [data-man="man-hold"]')?.textContent).not.toContain('Subir');
    expect(modal?.querySelector('ui-operation-board [data-man="man-hold"]')?.textContent).not.toContain('Quitar');
    expect(modal?.textContent).not.toContain('Añadir en este orden');
    expect(modal?.querySelector('app-breadcrumb')).not.toBeNull();
    expect(modal?.querySelector('app-breadcrumb')?.textContent).toContain('Catálogo');
    fixture.componentInstance.showManeuverOrder(phase.key, dual.key);
    fixture.detectChanges();
    expect(fixture.componentInstance.maneuverPickerMode()).toBe('order');
    expect(fixture.componentInstance.maneuverPickerView()).toBe('grouped');
    expect(modal?.querySelector('ui-operation-board .ob--readonly')).not.toBeNull();
    expect(modal?.textContent).toContain('TOFF · Despegue');
    expect(modal?.textContent).toContain('LAND · Aterrizaje');
    expect(modal?.textContent).toContain('Vuelo visual');
    expect(modal?.querySelectorAll('ui-operation-board [data-op]').length).toBe(1);
    expect(modal?.querySelector('ui-operation-board [data-assigned="man-toff"]')?.textContent).toContain('TOFF');
    expect(modal?.querySelector('ui-operation-board [data-assigned="man-land"]')?.textContent).toContain('LAND');
    expect(modal?.textContent).not.toContain('Añadir en este orden');
    expect(modal?.textContent).not.toContain('Buscar operación');
    expect(modal?.querySelector('ui-operation-board ui-select')).toBeNull();
    expect(modal?.querySelector('ui-operation-board')?.textContent).not.toContain('Subir');
    expect(modal?.querySelector('ui-operation-board')?.textContent).not.toContain('Quitar');
    expect(modal?.querySelector('app-breadcrumb')).toBeNull();
    expect(modal?.textContent).not.toContain('Por operaciones');
    fixture.componentInstance.onManeuverCrumb('catalog');
    fixture.detectChanges();
    expect(fixture.componentInstance.maneuverPickerView()).toBe('grouped');
    fixture.componentInstance.removeManeuver(phase.key, dual.key, 'HOLD · Espera');
    fixture.detectChanges();
    expect(fixture.componentInstance.phases()[1].subphases[1].maneuverIds).not.toContain('man-hold');
  });
});

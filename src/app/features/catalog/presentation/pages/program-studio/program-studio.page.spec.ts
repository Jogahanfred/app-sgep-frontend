import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS } from '../../shared/forms/catalog-form';
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
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    let text = root.textContent ?? '';
    expect(text).toContain('Diseñar plan de estudios');
    expect(text).toContain('Módulos');
    expect(text).toContain('Arquitectura de módulos');
    expect(text).toContain('Matriz');
    expect(text).toContain('Póster del programa');
    expect(text).toContain('Cambiar póster');
    expect(root.querySelector('ui-poster-field input[type="file"]')).not.toBeNull();
    expect(root.querySelector('ui-poster-field img')?.getAttribute('src')).toBe('/programs/ppl.jpg');
    expect(root.querySelector('ui-assign-block')).toBeNull();

    page.goToStep('architecture');
    fixture.detectChanges();
    expect(root.querySelector('.ap__head h1')?.textContent?.trim()).toBe('Arquitectura de módulos');
    text = root.textContent ?? '';
    expect(text).toContain('Vuelo básico');
    expect(text).toContain('Dual');
    expect(text).toContain('Subfase 1');
    expect(text).toContain('Subfase 2');
    expect(text).toContain('Añadir fase al itinerario');
    expect(text).toContain('Editar fase');
    expect(text).not.toContain('Banco de fases');
    expect(text).not.toContain('Banco de subfases');
    expect(root.querySelector('a[href="/catalogo/banco-fases"]')).toBeNull();
    expect(root.querySelector('a[href="/catalogo/banco-subfases"]')).toBeNull();
    expect(root.querySelector('ui-select[id^="phase-bank-"]')).toBeNull();
    expect(root.querySelector('[id^="sub-bank-"]')).toBeNull();
    expect(root.querySelector('.path ui-table')).toBeNull();
    expect(root.querySelector('ui-input input[id^="hours-"]')).not.toBeNull();
    expect(root.querySelector('label.lesson__hours')).toBeNull();
    expect(root.querySelector('ui-assign-block')).toBeNull();

    page.goToStep('matrix');
    fixture.detectChanges();
    const solo = page.phases().find((phase) => phase.phaseBankId === 'pb-solo');
    expect(solo).toBeTruthy();
    page.setMatrixTargetValue(`${solo!.key}:${solo!.subphases[0].key}`);
    fixture.detectChanges();
    text = root.textContent ?? '';
    expect(text).toContain('Matriz de calificación');
    expect(text).toContain('Ampliar pantalla');
    expect(text).toContain('C1');
    expect(text).toContain('C8');
    expect(text).toContain('C17');
    expect(text).toContain('Calibrador de celda');
    expect(text).toContain('LAND');
    expect(root.querySelector('input[id^="ms-"]')).toBeNull();
    expect(root.querySelector('input[id^="mn-"]')).toBeNull();
    expect(root.querySelector('fieldset.picks')).toBeNull();
    expect(text).toContain('Guardar programa');
    expect(text).not.toContain('Guardar plan');

    page.selectModule('ground');
    page.goToStep('architecture');
    fixture.detectChanges();
    text = root.textContent ?? '';
    expect(text).toContain('Teoría en aula');
    expect(text).toContain('Teoría Aeronáutica I');
    expect(text).toContain('Curso');
    expect(text).not.toContain('Fase 1');
    expect(text).toContain('NIT = NCT');
    expect(root.querySelector('.path ui-table')).not.toBeNull();
    expect(page.wizardSteps().includes('matrix')).toBe(false);
  });

  it('no avanza si faltan datos del paso actual', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramStudioPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS, { provide: ActivatedRoute, useValue: routeSnapshot(null) }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStudioPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    page.goNext();
    fixture.detectChanges();
    expect(page.step()).toBe('plan');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Completa el código y el nombre del programa');
    page.form.controls.code.setValue('NEW-1');
    page.form.controls.name.setValue('Nuevo programa');
    page.goNext();
    fixture.detectChanges();
    expect(page.step()).toBe('modules');
    page.goNext();
    fixture.detectChanges();
    expect(page.step()).toBe('modules');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Activa al menos un módulo');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Activo');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Avanzar');
    expect(page.wizardSteps().includes('matrix')).toBe(false);
    page.setModuleEnabled('ground', true);
    page.setModuleEnabled('air', true);
    page.setModuleEnabled('simulator', true);
    page.setAdvanceModule('air', true);
    fixture.detectChanges();
    expect(page.moduleEnabled('ground')).toBe(true);
    expect(page.moduleEnabled('air')).toBe(true);
    expect(page.moduleEnabled('simulator')).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Continuar Aire');
    expect(page.wizardSteps().includes('matrix')).toBe(true);
    page.setAdvanceModule('ground', true);
    fixture.detectChanges();
    expect(page.moduleEnabled('air')).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Continuar Tierra');
    expect(page.wizardSteps().includes('matrix')).toBe(false);
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
    const page = fixture.componentInstance;
    expect(page.phases().length).toBe(0);
    page.form.controls.code.setValue('NEW-1');
    page.form.controls.name.setValue('Nuevo programa');
    page.toggleModule('air');
    page.goToStep('architecture');
    page.addPhase('air');
    fixture.detectChanges();
    expect(page.phases().length).toBe(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Fase 1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Subfase 1');
    page.goToStep('plan');
    fixture.detectChanges();
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
    const page = fixture.componentInstance;
    page.goToStep('architecture');
    fixture.detectChanges();
    const airPhase = page.phases().find((phase) => phase.moduleKind === 'air');
    expect(airPhase).toBeTruthy();
    const firstKey = airPhase!.key;
    page.openPhaseBankPicker(firstKey);
    fixture.detectChanges();
    const modal =
      [...(fixture.nativeElement as HTMLElement).querySelectorAll('app-modal')].find((item) =>
        (item.textContent ?? '').includes('Editar fase'),
      ) ?? null;
    const modalText = modal?.textContent ?? '';
    expect(modal?.querySelector('ui-table')).not.toBeNull();
    expect(modalText).toContain('Editar fase');
    expect(modalText).toContain('TEO');
    expect(modalText).toContain('Teoría en aula');
    expect(modalText).toContain('En el programa');
    expect(modalText).toContain('IFR');
    expect(modalText).toContain('Instrumental');
    expect(modalText).toContain('Mostrando 1 - 4 de 15');
    expect(modalText).not.toContain('Vuelo solo');
    expect(modalText).not.toContain('Prueba de pericia');
    page.phaseBankSearch.setValue('BAS');
    fixture.detectChanges();
    expect((modal?.textContent ?? '')).toContain('Vuelo básico');
    expect((modal?.textContent ?? '')).not.toContain('Instrumental');
    page.pickerSelectedId.set('pb-ifr');
    page.applyPickerPhase();
    fixture.detectChanges();
    expect(page.phases().find((phase) => phase.key === firstKey)?.phaseBankId).toBe('pb-ifr');
    expect(page.phaseBankOpen()).toBe(false);
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
    const page = fixture.componentInstance;
    page.goToStep('matrix');
    fixture.detectChanges();
    const dual = page.phases()[1].subphases[1];
    page.openMissionPicker(page.phases()[1].key, dual.key);
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
    page.startAddingMissions();
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
    page.draftMissionName.update((map) => ({ ...map, [dual.key]: 'Circuito bajo' }));
    page.addCustomMission(page.phases()[1].key, dual.key);
    fixture.detectChanges();
    expect(page.phases()[1].subphases[1].customMissionNames).toContain('Circuito bajo');
    expect(page.generatedMissions().some((item) => item.label === 'Circuito bajo')).toBe(true);
    expect(page.missionAdding()).toBe(false);
  });

  it('añade maniobras desde el catálogo y las muestra como chips', async () => {
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [ProgramStudioPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS, { provide: ActivatedRoute, useValue: routeSnapshot('prg-ppl', 'edit') }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStudioPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    page.goToStep('matrix');
    fixture.detectChanges();
    const phase = page.phases()[1];
    const dual = phase.subphases[1];
    page.setMatrixTargetValue(`${phase.key}:${dual.key}`);
    fixture.detectChanges();
    page.openManeuverPicker(phase.key, dual.key);
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
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('HOLD');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Espera');
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

  it('en tierra muestra cursos y asignaturas del programa de helicóptero', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramStudioPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS, { provide: ActivatedRoute, useValue: routeSnapshot('prg-heli-2023', 'view') }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStudioPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    page.selectModule('ground');
    page.goToStep('architecture');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Instrucción en tierra');
    expect(text).toContain('Curso');
    expect(text).not.toContain('Fase 1');
    expect(text).toContain('CTPH-1');
    expect(text).toContain('CTPH-2');
    expect(text).toContain('CCAM');
    expect(text).toContain('Aerodinámica');
    expect(text).toContain('0,13');
    expect(text).toContain('0,22');
    expect(text).toContain('NIT = NCT');
    expect(text).toContain('NFPI = NIT');
    expect(text).toContain('Pond. NEI');
    expect(text).toContain('Inopinado');
    expect(text).toContain('Emergencias críticas');
    expect(text).not.toContain('Editar curso');
    expect(text).toContain('El programa de 2025 está culminado');
    expect(text).not.toContain('Añadir asignatura');
    expect(text).not.toContain('Añadir curso al itinerario');
    expect(text).not.toContain('Añadir test');
    expect(root.querySelector('.workspace--full')).not.toBeNull();
    expect(root.querySelector('[id^="add-course-"]')).toBeNull();
    expect(root.querySelector('input[id^="gs-name-"]')).toBeNull();
    expect(root.querySelector('input#periodic-period')).toBeNull();
    expect(text).not.toContain('Métricas del plan');
    expect(text).not.toContain('Requisitos de progresión');
    page.collapseAll();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Matemática');
    page.expandAll();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Matemática');
    page.selectModule('simulator');
    fixture.detectChanges();
    const simText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(simText).toContain('Simulador de vuelo');
    expect(simText).toContain('Contacto en simulador');
    expect(simText).toContain('SIM-CON');
    expect(root.querySelector('.workspace--full')).toBeNull();
  });
});

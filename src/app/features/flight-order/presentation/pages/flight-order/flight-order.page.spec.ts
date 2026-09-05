import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ClientSession } from '@layout/client-session.service';
import { FlightOrderPage } from './flight-order.page';
import { FLIGHT_ORDER_COPY } from '../../../constants/flight-order.copy.constants';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<FlightOrderPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
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

describe('FlightOrderPage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [FlightOrderPage],
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

  it('muestra alumnos de promoción y el panel de emisión', async () => {
    const fixture = TestBed.createComponent(FlightOrderPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(FLIGHT_ORDER_COPY.treeTitle);
    expect(text).toContain(FLIGHT_ORDER_COPY.kpiCompleted);
    expect(text).toContain(FLIGHT_ORDER_COPY.programLabel);
    expect(text).not.toContain(FLIGHT_ORDER_COPY.sheetKicker);
    expect(text).not.toContain(FLIGHT_ORDER_COPY.goDispatch);
    expect(text).not.toContain(FLIGHT_ORDER_COPY.scheduleMission);
    expect(text).toContain('Curso Piloto de Helicóptero');
    expect(text).toContain('Diego Molina');
    expect(text).toContain('Promoción Alfa 2025');
    expect(text).toContain(FLIGHT_ORDER_COPY.treeModule.ground);
    expect(text).toContain(FLIGHT_ORDER_COPY.treeModule.air);
    expect(text).toContain(FLIGHT_ORDER_COPY.treeModule.simulator);
    expect(text).toContain('Adaptación');
    expect(text).toContain('Operaciones helitransportadas');
    expect(text).toContain('Contacto');
    expect(text).not.toContain('Piloto privado · ala fija');
    expect(text).toContain(FLIGHT_ORDER_COPY.rosterIndividual);
    expect(text).toContain(FLIGHT_ORDER_COPY.rosterPromo);
    expect(text).not.toContain('Alumno seleccionado');
    expect(text).not.toContain('Listos para asignar');
    expect(text).not.toContain('Programa completado');
    expect(text).toContain(FLIGHT_ORDER_COPY.treeTitle);
  });

  it('permite consultar una misión completada sin editarla', async () => {
    const fixture = TestBed.createComponent(FlightOrderPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    page.setTreeModule('air');
    fixture.detectChanges();
    const completed = page
      .treePhases()
      .flatMap((phase) => phase.subphases.flatMap((item) => item.missions))
      .find((item) => item.status === 'completed');
    expect(completed).toBeTruthy();
    page.pickMission(completed!.id);
    page.openOrder();
    fixture.detectChanges();
    expect(page.previewOpen()).toBe(true);
    expect(page.orderReadOnly()).toBe(true);
    expect(page.dateField.disabled).toBe(true);
    expect(page.timeField.disabled).toBe(true);
    expect(page.canSubmit()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(FLIGHT_ORDER_COPY.viewTitle);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(FLIGHT_ORDER_COPY.shiftLabel);
  });

  it('busca persona, filtra promoción y muestra el árbol del alumno', async () => {
    const fixture = TestBed.createComponent(FlightOrderPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain(FLIGHT_ORDER_COPY.searchLabel);
    expect(root.textContent).toContain(FLIGHT_ORDER_COPY.promotionLabel);
    expect(root.querySelector('ui-curriculum-tree')).not.toBeNull();
    expect(root.querySelector('#flight-order-search')).not.toBeNull();
    expect(root.querySelector('#flight-order-promotion')).not.toBeNull();
    expect(root.querySelector('#flight-order-program')).not.toBeNull();
    expect(page.promotionId()).toBeTruthy();
    expect(page.selected()?.curriculum.phases.length).toBeGreaterThan(0);

    page.search.setValue('Diego');
    fixture.detectChanges();
    expect(root.textContent).toContain('Diego Molina');
    expect(root.textContent).not.toContain('Natalia Rey');
    expect(page.canScheduleSelected()).toBe(false);

    page.search.setValue('persona-inexistente');
    fixture.detectChanges();
    expect(root.textContent).toContain(FLIGHT_ORDER_COPY.emptySearch);
    expect(page.selected()).toBeNull();
  });

  it('muestra los dos alumnos libres del curso de helicóptero', async () => {
    const fixture = TestBed.createComponent(FlightOrderPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;

    page.setRoster('individual');
    fixture.detectChanges();
    expect(root.textContent).toContain('Natalia Rey');
    expect(root.textContent).toContain('Silvia Rueda');
    expect(root.querySelector('#flight-order-promotion')).toBeNull();
    expect(page.programFilter()).toBe('prg-heli-2023');
  });

  it('cambia el árbol entre tierra, aire y simulador', async () => {
    const fixture = TestBed.createComponent(FlightOrderPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Adaptación');
    expect(root.textContent).not.toContain('Aerodinámica');

    page.setTreeModule('ground');
    fixture.detectChanges();
    expect(root.textContent).toContain('Aerodinámica');
    expect(root.textContent).toContain(FLIGHT_ORDER_COPY.groundNa);
    expect(root.textContent).toContain(`${FLIGHT_ORDER_COPY.groundPe} (0,6)`);
    expect(root.textContent).toContain('Trabajo 1');
    expect(root.textContent).toContain('Orales');
    expect(root.textContent).toContain(FLIGHT_ORDER_COPY.groundGrade);
    expect(root.querySelector('#ct-course-' + page.treePhases().find((item) => item.title === 'Aerodinámica')?.id)).not.toBeNull();
    expect(root.textContent).toContain('Matemática');
    expect(root.textContent).not.toContain('Adaptación');

    page.setTreeModule('simulator');
    fixture.detectChanges();
    expect(root.textContent).toContain('Contacto en simulador');
    expect(root.textContent).toContain(FLIGHT_ORDER_COPY.treeMissions);
    expect(root.textContent).not.toContain('Aerodinámica');
  });

  it('carga Matemática en el expediente del alumno', async () => {
    const fixture = TestBed.createComponent(FlightOrderPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    page.setRoster('individual');
    fixture.detectChanges();
    const natalia = page.snapshot()?.trainees.find((item) => item.userId === 'usr-natalia-rey-cubero');
    expect(natalia).toBeTruthy();
    page.select(natalia!.id);
    page.setTreeModule('ground');
    fixture.detectChanges();
    expect(page.treePhases().find((item) => item.title === 'Matemática')?.selected).toBe(false);
    const mathId = natalia!.groundCourses.find((item) => item.name === 'Matemática')?.id;
    page.setGroundCourse(mathId!, true);
    const started = Date.now();
    while (!page.treePhases().find((item) => item.title === 'Matemática')?.selected && Date.now() - started < 8000) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      fixture.detectChanges();
    }
    expect(page.treePhases().find((item) => item.title === 'Matemática')?.selected).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Examen 1');
  });

  describe('Grupo Aéreo 51', () => {
    beforeEach(() => {
      TestBed.inject(ClientSession).confirmContext({
        userId: 'usr-elena-martin',
        displayName: 'Elena Martín Ruiz',
        roleCode: 'ADSYS',
        assignedUnitId: null,
        assignedSquadronId: null,
        unitId: 'unit-ga-51',
        squadronId: 'sq-510',
        coversAllSquadrons: false,
      });
    });

    it('en tierra muestra el modelo de nueve cursos y habilita el siguiente', async () => {
      const fixture = TestBed.createComponent(FlightOrderPage);
      await waitReady(fixture);
      const page = fixture.componentInstance;
      page.setTreeModule('ground');
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      expect(root.textContent).toContain(FLIGHT_ORDER_COPY.kpiCoursesCompleted);
      expect(root.textContent).toContain('Teoría Aeronáutica I');
      expect(root.textContent).toContain('Práctica 1');
      expect(root.textContent).toContain('Taller de METAR/TAF');
      expect(root.textContent).toContain(FLIGHT_ORDER_COPY.groundPending);
      expect(root.textContent).toContain(FLIGHT_ORDER_COPY.groundGrade);
      expect(root.textContent).not.toContain('Aerodinámica');
      expect(root.textContent).not.toContain('Matemática');
      expect(page.treePhases().some((item) => item.title === 'Teoría Aeronáutica I')).toBe(true);
      expect(page.treePhases().some((item) => item.title === 'Operaciones de Vuelo')).toBe(true);
      expect(page.treePhases().find((item) => item.title === 'Procedimientos de Vuelo')?.selected).toBe(false);
      const prfId = page.selected()?.groundCourses.find((item) => item.name === 'Procedimientos de Vuelo')?.id;
      page.setGroundCourse(prfId!, true);
      const started = Date.now();
      while (!page.treePhases().find((item) => item.title === 'Procedimientos de Vuelo')?.selected && Date.now() - started < 8000) {
        await new Promise((resolve) => setTimeout(resolve, 20));
        fixture.detectChanges();
      }
      expect(page.treePhases().find((item) => item.title === 'Procedimientos de Vuelo')?.selected).toBe(true);
      expect(root.textContent).toContain('Simulación');
    });

    it('en simulador muestra las sesiones del dispositivo', async () => {
      const fixture = TestBed.createComponent(FlightOrderPage);
      await waitReady(fixture);
      const page = fixture.componentInstance;
      page.setTreeModule('simulator');
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      expect(root.textContent).not.toContain(FLIGHT_ORDER_COPY.treeModuleEmpty);
      expect(root.textContent).toContain('Simulador');
      expect(root.textContent).toContain('Procedimientos de cabina');
      expect(root.textContent).toContain('Emergencias');
      expect(page.treePhases().length).toBeGreaterThan(0);
    });
  });
});

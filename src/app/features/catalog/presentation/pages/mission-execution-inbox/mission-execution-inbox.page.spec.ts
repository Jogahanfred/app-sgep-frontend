import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { MissionExecutionInboxPage } from './mission-execution-inbox.page';
import { MISSION_EXECUTION_COPY, MISSION_EXECUTION_ROUTES } from './constants/mission-execution.copy.constants';

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

describe('MissionExecutionInboxPage', () => {
  afterEach(() => {
    document.documentElement.classList.remove('is-scroll-locked');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  });

  beforeEach(async () => {
    stubDialog();
    await TestBed.configureTestingModule({
      imports: [MissionExecutionInboxPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('muestra el centro operativo diario con KPI, tarjetas y panel lateral', () => {
    const fixture = TestBed.createComponent(MissionExecutionInboxPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.kicker);
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.kpi.scheduled);
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.kpi.inProgress);
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.kpi.completed);
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.kpi.cancelled);
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.nextTitle);
    expect(root.textContent).not.toContain('Alertas operativas');
    expect(root.textContent).toContain('Adela Mena López');
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.grade);
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.flightOrder);
    expect(root.textContent).toContain('ALU-510-1/INS-510');
    expect(root.querySelector('.mx__search')).not.toBeNull();
    expect(root.querySelector('#mission-execution-date')).not.toBeNull();
    expect(getComputedStyle(root.querySelector('.mx__pager') as HTMLElement).borderTopWidth).toBe('0px');
    expect(root.querySelector('.mx__fids-head .mx__search')).toBeNull();
    expect(root.querySelectorAll('.mx__fids-pane').length).toBe(2);
    expect(root.querySelectorAll('.mx__fids-pane .mx__board > li').length).toBe(10);
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.nextBoarding);
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.nextState);
    expect(root.textContent).toContain('06:55');
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.fidsBoarding.toUpperCase());
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.fidsClosing.toUpperCase());
    expect(MISSION_EXECUTION_COPY.fidsClosing.length).toBeLessThanOrEqual(10);
    expect(root.querySelector('.mx__fids-ch')).not.toBeNull();
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.nextTime);
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.nextCrew);
    const firstRow = root.querySelector('.mx__board .mx__fids-row');
    const cellCounts = [
      firstRow?.querySelectorAll('.mx__fids-cells--time .mx__fids-ch').length,
      firstRow?.querySelectorAll('.mx__fids-cells--crew .mx__fids-ch').length,
      firstRow?.querySelectorAll('.mx__fids-cells--ac .mx__fids-ch').length,
      firstRow?.querySelectorAll('.mx__fids-cells--gate .mx__fids-ch').length,
      firstRow?.querySelectorAll('.mx__fids-cells--status .mx__fids-ch').length,
    ];
    expect(cellCounts).toEqual([5, 17, 7, 5, 10]);
    expect(root.textContent).not.toContain('Recuperaciones pendientes');
    expect(root.textContent).toContain('Mostrando 1 - 4 de 6');
    expect(root.querySelector('.mx__slot--next')).not.toBeNull();
    expect(root.querySelector('.mx__board-row--on')).not.toBeNull();
    expect(root.querySelector('.mx__shell')).not.toBeNull();
    const factLabels = Array.from(root.querySelectorAll('.mx__facts dt')).map((node) => node.textContent?.trim());
    expect(factLabels).not.toContain('Estado');
  });

  it('pagina las misiones del día con el formato de la tabla', () => {
    const fixture = TestBed.createComponent(MissionExecutionInboxPage);
    const page = fixture.componentInstance;
    fixture.detectChanges();
    expect(page.pagedVisible().map((item) => item.student)).toEqual([
      'Adela Mena López',
      'Bruno Roca Vidal',
      'Clara Sanz Prieto',
      'Darío Vega Nieto',
    ]);
    page.next();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Mostrando 5 - 6 de 6');
    expect(page.pagedVisible().map((item) => item.student)).toEqual(['Diego Molina', 'Natalia Rey Cubero']);
  });

  it('muestra Ver detalle solo en misiones finalizadas y Calificar en las pendientes', () => {
    const fixture = TestBed.createComponent(MissionExecutionInboxPage);
    const page = fixture.componentInstance;
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const firstCards = Array.from(root.querySelectorAll('.mx__card'));
    const adela = firstCards.find((card) => card.textContent?.includes('Adela Mena López'));
    expect(adela?.textContent).toContain(MISSION_EXECUTION_COPY.grade);
    expect(adela?.textContent).not.toContain(MISSION_EXECUTION_COPY.detail);
    page.next();
    fixture.detectChanges();
    const laterCards = Array.from(root.querySelectorAll('.mx__card'));
    const diego = laterCards.find((card) => card.textContent?.includes('Diego Molina'));
    const natalia = laterCards.find((card) => card.textContent?.includes('Natalia Rey Cubero'));
    expect(diego?.textContent).toContain(MISSION_EXECUTION_COPY.detail);
    expect(diego?.textContent).not.toContain(MISSION_EXECUTION_COPY.grade);
    expect(natalia?.textContent).not.toContain(MISSION_EXECUTION_COPY.grade);
    expect(natalia?.textContent).not.toContain(MISSION_EXECUTION_COPY.detail);
    expect(natalia?.textContent).toContain(MISSION_EXECUTION_COPY.flightOrder);
  });

  it('abre la orden de vuelo operacional con misión, tripulación y slot', () => {
    const fixture = TestBed.createComponent(MissionExecutionInboxPage);
    const page = fixture.componentInstance;
    fixture.detectChanges();
    page.openOrder(page.board().missions[0]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const order = root.querySelector('.mx__order');
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.orderTitle);
    expect(order?.textContent).toContain(MISSION_EXECUTION_COPY.orderLead);
    expect(order?.textContent).toContain(MISSION_EXECUTION_COPY.orderMission);
    expect(order?.textContent).toContain(MISSION_EXECUTION_COPY.orderCrew);
    expect(order?.textContent).toContain(MISSION_EXECUTION_COPY.orderAircraftBlock);
    expect(order?.textContent).toContain(MISSION_EXECUTION_COPY.orderSlotBlock);
    expect(order?.textContent).toContain(MISSION_EXECUTION_COPY.orderNotesBlock);
    expect(order?.textContent).toContain('OV-089');
    expect(order?.textContent).toContain('LOC · Misión local');
    expect(order?.textContent).toContain('ALU-510-1 (AP)');
    expect(order?.textContent).toContain('INS-510 (IP)');
    expect(order?.textContent).toContain('Elena Martín Ruiz');
    expect(order?.textContent).toContain('07:55 – 09:10');
  });

  it('filtra por estado y búsqueda', () => {
    const fixture = TestBed.createComponent(MissionExecutionInboxPage);
    const page = fixture.componentInstance;
    fixture.detectChanges();
    page.setFilter('cancelled');
    fixture.detectChanges();
    expect(page.visible().every((item) => item.status === 'cancelled')).toBe(true);
    page.setFilter('all');
    page.search.setValue('Clara');
    fixture.detectChanges();
    expect(page.visible().map((item) => item.student)).toEqual(['Clara Sanz Prieto']);
    expect(page.pagedVisible().map((item) => item.student)).toEqual(['Clara Sanz Prieto']);
  });

  it('actualiza el día operativo y bloquea En curso en fechas anteriores', () => {
    const fixture = TestBed.createComponent(MissionExecutionInboxPage);
    const page = fixture.componentInstance;
    fixture.detectChanges();
    page.setFilter('in-progress');
    fixture.detectChanges();
    expect(page.visible().every((item) => item.status === 'in-progress')).toBe(true);
    const nonce = page.fidsNonce();
    page.boardDate.setValue('2026-09-04');
    fixture.detectChanges();
    expect(page.board().operationDate).toBe('04/09/2026');
    expect(page.kpis().inProgress).toBe(0);
    expect(page.kpis().completed).toBe(5);
    expect(page.filter()).toBe('all');
    expect(page.filterOptions().find((option) => option.value === 'in-progress')?.disabled).toBe(true);
    expect(page.fidsNonce()).toBe(nonce + 1);
    page.setFilter('in-progress');
    expect(page.filter()).toBe('all');
    expect(page.pagedVisible().every((item) => page.canGrade(item))).toBe(false);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('04/09/2026');
    expect(root.querySelector('button[aria-disabled="true"]')?.textContent).toContain(MISSION_EXECUTION_COPY.filter['in-progress']);
  });

  it('abre el tablero en su propia página y vuelve al inbox', () => {
    const fixture = TestBed.createComponent(MissionExecutionInboxPage);
    const page = fixture.componentInstance;
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.fidsExpand);
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.fidsReload);
    expect(root.querySelector('.mx__fids--theater')).toBeNull();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    page.expandFids();
    expect(navigate).toHaveBeenCalledWith(MISSION_EXECUTION_ROUTES.board);
    page.collapseFids();
    expect(navigate).toHaveBeenCalledWith(MISSION_EXECUTION_ROUTES.inbox);
    const nonce = page.fidsNonce();
    page.reloadFids();
    expect(page.fidsNonce()).toBe(nonce + 1);
  });

  it('muestra próximas ejecuciones a página completa en /tablero', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue(MISSION_EXECUTION_ROUTES.board);
    const fixture = TestBed.createComponent(MissionExecutionInboxPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.fidsExpanded()).toBe(true);
    expect(root.querySelector('.mx__fids--theater')).not.toBeNull();
    expect(root.querySelectorAll('.mx__fids-pane').length).toBe(1);
    expect(root.querySelectorAll('.mx__fids-pane .mx__board > li').length).toBe(20);
    expect(root.textContent).toContain(MISSION_EXECUTION_COPY.fidsCollapse);
    expect(root.textContent).not.toContain(MISSION_EXECUTION_COPY.kicker);
    expect(document.documentElement.classList.contains('is-scroll-locked')).toBe(true);
  });
});

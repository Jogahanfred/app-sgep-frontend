import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UiOperationBoard } from './ui-operation-board';

describe('UiOperationBoard', () => {
  it('muestra todas las operaciones y agrupa al soltar una maniobra', () => {
    TestBed.configureTestingModule({ imports: [UiOperationBoard] });
    const fixture = TestBed.createComponent(UiOperationBoard);
    fixture.componentRef.setInput('operations', [
      { id: 'op-vfr', name: 'Vuelo visual' },
      { id: 'op-ifr', name: 'Vuelo instrumental' },
      { id: 'op-nav', name: 'Navegación' },
      { id: 'op-emer', name: 'Emergencias' },
    ]);
    fixture.componentRef.setInput('maneuvers', [
      { id: 'man-toff', label: 'TOFF · Despegue' },
      { id: 'man-stall', label: 'STALL · Pérdida' },
    ]);
    fixture.componentRef.setInput('order', ['op-vfr', 'op-ifr', 'op-nav', 'op-emer']);
    fixture.componentRef.setInput('assignment', {});
    fixture.detectChanges();

    const assigned = vi.fn();
    const ordered = vi.fn();
    fixture.componentInstance.assignmentChange.subscribe(assigned);
    fixture.componentInstance.orderChange.subscribe(ordered);

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('table')).toBeNull();
    expect(root.textContent).toContain('Vuelo visual');
    expect(root.textContent).toContain('Vuelo instrumental');
    expect(root.textContent).toContain('Navegación');
    expect(root.textContent).toContain('Emergencias');
    expect(root.textContent).toContain('TOFF · Despegue');
    expect(root.querySelectorAll('[data-op]').length).toBe(4);

    fixture.componentInstance.place('man-toff', 'op-vfr');
    expect(assigned).toHaveBeenCalledWith({ 'man-toff': 'op-vfr' });
    fixture.componentInstance.shiftOperation('op-emer', -1);
    expect(ordered).toHaveBeenCalledWith(['op-vfr', 'op-ifr', 'op-emer', 'op-nav']);
  });
});

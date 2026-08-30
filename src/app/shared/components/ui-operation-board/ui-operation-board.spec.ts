import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UiOperationBoard } from './ui-operation-board';

describe('UiOperationBoard', () => {
  it('busca operaciones primero y deja todas las maniobras debajo', () => {
    TestBed.configureTestingModule({ imports: [UiOperationBoard] });
    const fixture = TestBed.createComponent(UiOperationBoard);
    fixture.componentRef.setInput('catalog', [
      { id: 'op-vfr', name: 'Vuelo visual', description: 'Circuitos' },
      { id: 'op-ifr', name: 'Vuelo instrumental' },
      { id: 'op-nav', name: 'Navegación' },
      { id: 'op-emer', name: 'Emergencias' },
    ]);
    fixture.componentRef.setInput('maneuvers', [
      { id: 'man-toff', label: 'TOFF · Despegue' },
      { id: 'man-stall', label: 'STALL · Pérdida' },
    ]);
    fixture.componentRef.setInput('order', []);
    fixture.componentRef.setInput('assignment', {});
    fixture.detectChanges();

    const assigned = vi.fn();
    const ordered = vi.fn();
    fixture.componentInstance.assignmentChange.subscribe(assigned);
    fixture.componentInstance.orderChange.subscribe(ordered);

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('input[type="search"]')).not.toBeNull();
    expect(root.querySelectorAll('[data-op]').length).toBe(0);
    expect(root.textContent).toContain('TOFF · Despegue');
    expect(root.textContent).toContain('STALL · Pérdida');
    expect(root.textContent).toContain('Busca arriba para elegir las operaciones');

    fixture.componentInstance.query.set('visual');
    fixture.detectChanges();
    expect(root.textContent).toContain('Vuelo visual');
    expect(root.textContent).not.toContain('Navegación');
    fixture.componentInstance.pickOperation('op-vfr');
    expect(ordered).toHaveBeenCalledWith(['op-vfr']);

    fixture.componentRef.setInput('order', ['op-vfr']);
    fixture.detectChanges();
    expect(root.querySelectorAll('[data-op]').length).toBe(1);
    expect(root.textContent).toContain('TOFF · Despegue');

    fixture.componentInstance.place('man-toff', 'op-vfr');
    expect(assigned).toHaveBeenCalledWith({ 'man-toff': 'op-vfr' });
    fixture.componentRef.setInput('assignment', { 'man-toff': 'op-vfr' });
    fixture.detectChanges();
    expect(root.textContent).toContain('TOFF · Despegue');
    expect(root.querySelector('.ob__chip--used')).not.toBeNull();

    fixture.componentInstance.forgetOperation('op-vfr');
    expect(ordered).toHaveBeenCalledWith([]);
    expect(assigned).toHaveBeenCalledWith({});
    fixture.componentInstance.shiftOperation('op-vfr', 1);
    expect(ordered).toHaveBeenCalledTimes(2);
  });
});

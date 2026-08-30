import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UiPickList } from './ui-pick-list';

describe('UiPickList', () => {
  it('lista registros y permite marcarlos o añadirlos', () => {
    TestBed.configureTestingModule({ imports: [UiPickList] });
    const fixture = TestBed.createComponent(UiPickList);
    fixture.componentRef.setInput('items', [
      { id: 'toff', title: 'TOFF · Despegue', hint: 'Carrera y rotación.' },
      { id: 'hold', title: 'HOLD · Espera', actionDisabled: true },
    ]);
    fixture.componentRef.setInput('checkedIds', ['toff']);
    fixture.detectChanges();

    const picked = vi.fn();
    const checked = vi.fn();
    fixture.componentInstance.actionClick.subscribe(picked);
    fixture.componentInstance.checkedIdsChange.subscribe(checked);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('table')).toBeNull();
    expect(root.querySelectorAll('li').length).toBe(2);
    expect(root.textContent).toContain('TOFF · Despegue');
    const addButtons = [...root.querySelectorAll('button')].filter((node) =>
      (node.textContent ?? '').includes('Añadir'),
    );
    expect(addButtons).toHaveLength(2);
    expect((addButtons[1] as HTMLButtonElement).disabled).toBe(true);
    addButtons[0].click();
    expect(picked).toHaveBeenCalledWith('toff');
    (root.querySelectorAll('input[type="checkbox"]')[1] as HTMLInputElement).click();
    expect(checked).toHaveBeenCalledWith(['toff', 'hold']);
  });
});

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from '../button/button';
import { UiAssignBlock } from './ui-assign-block';

@Component({
  imports: [UiAssignBlock, Button],
  template: `
    <ui-assign-block title="Misiones" hint="Qué sesiones vuela el alumno." countLabel="Ninguna">
      <app-button blockAction type="button" size="xs">Añadir</app-button>
      <p>Esta subfase aún no tiene misiones.</p>
    </ui-assign-block>
  `,
})
class AssignHost {}

describe('UiAssignBlock', () => {
  it('separa un bloque con título, ayuda y recuento', () => {
    TestBed.configureTestingModule({ imports: [UiAssignBlock] });
    const fixture = TestBed.createComponent(UiAssignBlock);
    fixture.componentRef.setInput('title', 'Misiones');
    fixture.componentRef.setInput('hint', 'Qué sesiones vuela el alumno.');
    fixture.componentRef.setInput('countLabel', '2 misiones');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Misiones');
    expect(text).toContain('Qué sesiones vuela el alumno.');
    expect(text).toContain('2 misiones');
  });

  it('coloca la acción al nivel del título', () => {
    TestBed.configureTestingModule({ imports: [AssignHost] });
    const fixture = TestBed.createComponent(AssignHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const action = root.querySelector('.ab__bar app-button');
    expect(action?.textContent).toContain('Añadir');
    expect(root.querySelector('.ab__body app-button')).toBeNull();
    const empty = root.querySelector('.ab__body p') as HTMLElement;
    expect(getComputedStyle(empty).textAlign).toBe('center');
  });
});

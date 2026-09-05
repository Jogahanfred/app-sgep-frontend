import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UiPersonCard } from './ui-person-card';

describe('UiPersonCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiPersonCard],
    }).compileComponents();
  });

  it('muestra persona, progreso y chips, y emite la selección', () => {
    const fixture = TestBed.createComponent(UiPersonCard);
    fixture.componentRef.setInput('name', 'Iván Rubio');
    fixture.componentRef.setInput('meta', 'IR-01 · Promoción 2026-I');
    fixture.componentRef.setInput('badge', 'Listo para asignar');
    fixture.componentRef.setInput('actionLabel', 'Asignar orden');
    fixture.componentRef.setInput('progressValue', 25);
    fixture.componentRef.setInput('progressCaption', 'Avance curricular: 2 de 8 misiones');
    fixture.componentRef.setInput('highlightLabel', 'Siguiente misión');
    fixture.componentRef.setInput('highlightText', 'C-01 Familiarización');
    fixture.componentRef.setInput('highlightHint', '1.5 h');
    fixture.componentRef.setInput('tags', ['PDI-HELI', 'Fase aire']);
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();

    const picked = vi.fn();
    const assigned = vi.fn();
    fixture.componentInstance.selectedChange.subscribe(picked);
    fixture.componentInstance.actionClick.subscribe(assigned);

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Iván Rubio');
    expect(root.textContent).toContain('Listo para asignar');
    expect(root.textContent).toContain('C-01 Familiarización');
    expect(root.textContent).toContain('PDI-HELI');
    expect(root.querySelector('.pc--on')).not.toBeNull();

    (root.querySelector('.pc') as HTMLElement).click();
    expect(picked).toHaveBeenCalled();

    const action = [...root.querySelectorAll('button')].find((node) => node.textContent?.includes('Asignar orden'));
    action?.click();
    expect(assigned).toHaveBeenCalled();
  });
});

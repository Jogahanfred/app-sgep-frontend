import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UiChip } from './ui-chip';

describe('UiChip', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiChip],
    }).compileComponents();
  });

  it('muestra la etiqueta y permite quitarla', () => {
    const fixture = TestBed.createComponent(UiChip);
    fixture.componentRef.setInput('label', 'Circuito corto');
    fixture.componentRef.setInput('removable', true);
    fixture.detectChanges();

    const removed = vi.fn();
    fixture.componentInstance.removed.subscribe(removed);
    const root = fixture.nativeElement as HTMLElement;
    const flip = root.querySelector('.chip--flip') as HTMLButtonElement;
    expect(flip).not.toBeNull();
    expect(root.querySelector('.chip__face--front')?.textContent).toContain('Circuito corto');
    expect(root.querySelector('.chip__face--back')?.textContent).toContain('Quitar');
    flip.click();
    expect(removed).toHaveBeenCalled();
  });

  it('marca el chip activo al elegirlo', () => {
    const fixture = TestBed.createComponent(UiChip);
    fixture.componentRef.setInput('label', 'Manual');
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();

    const picked = vi.fn();
    fixture.componentInstance.selectedChange.subscribe(picked);
    const button = (fixture.nativeElement as HTMLElement).querySelector('button.chip') as HTMLButtonElement;
    expect(button.classList.contains('chip--on')).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    button.click();
    expect(picked).toHaveBeenCalled();
  });
});

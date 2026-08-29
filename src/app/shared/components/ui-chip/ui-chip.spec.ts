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
    expect(root.textContent).toContain('Circuito corto');
    root.querySelector('button')?.click();
    expect(removed).toHaveBeenCalled();
  });
});

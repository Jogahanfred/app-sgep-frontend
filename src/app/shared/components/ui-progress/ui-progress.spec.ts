import { TestBed } from '@angular/core/testing';
import { UiProgress } from './ui-progress';

describe('UiProgress', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiProgress],
    }).compileComponents();
  });

  it('pinta el porcentaje y las etiquetas', () => {
    const fixture = TestBed.createComponent(UiProgress);
    fixture.componentRef.setInput('value', 40);
    fixture.componentRef.setInput('caption', 'Avance curricular');
    fixture.componentRef.setInput('valueLabel', '40% completado');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const bar = root.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute('aria-valuenow')).toBe('40');
    expect(root.textContent).toContain('Avance curricular');
    expect(root.textContent).toContain('40% completado');
  });
});

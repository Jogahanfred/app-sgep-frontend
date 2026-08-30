import { TestBed } from '@angular/core/testing';
import { UiGuidedTour } from './ui-guided-tour';

describe('UiGuidedTour', () => {
  it('centra el cuadro, oculta el contador y no permite omitir', async () => {
    await TestBed.configureTestingModule({
      imports: [UiGuidedTour],
    }).compileComponents();
    const host = document.createElement('article');
    host.setAttribute('data-tour', 'phase');
    host.style.width = '120px';
    host.style.height = '80px';
    host.style.borderRadius = '14px';
    document.body.appendChild(host);

    const fixture = TestBed.createComponent(UiGuidedTour);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('isFirst', false);
    fixture.componentRef.setInput('isLast', false);
    fixture.componentRef.setInput('step', {
      title: 'IFR · Instrumental',
      body: 'Una fase es una etapa del entrenamiento.',
      eyebrow: 'Fase',
      target: 'phase',
    });
    const next: string[] = [];
    fixture.componentInstance.next.subscribe(() => next.push('ok'));
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('IFR · Instrumental');
    expect(root.textContent).toContain('Siguiente');
    expect(root.textContent).toContain('Anterior');
    expect(root.textContent).not.toContain('Omitir');
    expect(root.textContent).not.toMatch(/\d+\s*\/\s*\d+/);
    expect(root.querySelector('.coach__tip')).not.toBeNull();
    [...root.querySelectorAll('button')].find((node) => (node.textContent ?? '').includes('Siguiente'))?.click();
    expect(next).toEqual(['ok']);
    host.remove();
  });
});

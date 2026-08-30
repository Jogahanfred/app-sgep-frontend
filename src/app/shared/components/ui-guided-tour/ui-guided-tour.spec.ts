import { TestBed } from '@angular/core/testing';
import { UiGuidedTour } from './ui-guided-tour';

describe('UiGuidedTour', () => {
  it('muestra progreso, Siguiente y Omitir sobre el paso activo', async () => {
    await TestBed.configureTestingModule({
      imports: [UiGuidedTour],
    }).compileComponents();
    const host = document.createElement('article');
    host.setAttribute('data-tour', 'phase');
    host.style.width = '120px';
    host.style.height = '80px';
    document.body.appendChild(host);

    const fixture = TestBed.createComponent(UiGuidedTour);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('index', 1);
    fixture.componentRef.setInput('total', 6);
    fixture.componentRef.setInput('isFirst', false);
    fixture.componentRef.setInput('isLast', false);
    fixture.componentRef.setInput('step', {
      title: 'BAS · Vuelo básico',
      body: 'Una fase es una etapa del entrenamiento.',
      eyebrow: 'Fase',
      target: 'phase',
    });
    const next: string[] = [];
    const skip: string[] = [];
    fixture.componentInstance.next.subscribe(() => next.push('ok'));
    fixture.componentInstance.skip.subscribe(() => skip.push('ok'));
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Fase · 2 / 6');
    expect(root.textContent).toContain('BAS · Vuelo básico');
    expect(root.textContent).toContain('Siguiente');
    expect(root.textContent).toContain('Anterior');
    expect(root.textContent).toContain('Omitir');
    const buttons = [...root.querySelectorAll('button')];
    buttons.find((node) => (node.textContent ?? '').includes('Siguiente'))?.click();
    buttons.find((node) => (node.textContent ?? '').includes('Omitir'))?.click();
    expect(next).toEqual(['ok']);
    expect(skip).toEqual(['ok']);
    host.remove();
  });
});

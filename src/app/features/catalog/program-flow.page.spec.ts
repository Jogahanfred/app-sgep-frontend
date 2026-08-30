import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ProgramFlowPage } from './program-flow.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<ProgramFlowPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('ProgramFlowPage', () => {
  it('entra en la primera fase y avanza el tiempo con Atrás y Siguiente', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramFlowPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'prg-ppl' }), data: {} } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramFlowPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Flujo de Piloto privado · ala fija');
    expect(text).toContain('Solo consulta');
    expect(text).toContain('Atrás');
    expect(text).toContain('Siguiente');
    expect(text).toContain('Fase 1 de 5');
    expect(fixture.componentInstance.step()).toBe(0);
    expect(fixture.componentInstance.current()?.name).toBe('TEO · Teoría en aula');
    const card = root.querySelector('.flow__phase')?.textContent ?? '';
    expect(card).toContain('TEO · Teoría en aula');
    expect(card).toContain('AULA · Aula');
    expect(card).not.toContain('DUAL · Dual');
    expect(card).not.toContain('Circuito corto');
    expect(card).not.toContain('C17');
    expect(card).not.toContain('Fin del programa');
    const back = [...root.querySelectorAll('button')].find((node) => (node.textContent ?? '').includes('Atrás'));
    const next = [...root.querySelectorAll('button')].find((node) => (node.textContent ?? '').includes('Siguiente'));
    expect(back?.disabled).toBe(true);
    expect(next?.disabled).toBe(false);
    expect(text).not.toContain('Añadir');
    expect(text).not.toContain('Guardar');
    expect(text).not.toContain('Editar fase');
    expect(root.querySelector('input')).toBeNull();
    expect(root.querySelector('form')).toBeNull();

    fixture.componentInstance.goNext();
    fixture.detectChanges();
    expect(fixture.componentInstance.step()).toBe(1);
    expect(fixture.componentInstance.current()?.name).toBe('BAS · Vuelo básico');
    const second = root.querySelector('.flow__phase')?.textContent ?? '';
    expect(second).toContain('DUAL · Dual');
    expect(second).toContain('Circuito corto');
    expect(second).toContain('TOFF · Despegue');
    expect(second).toContain('Vuelo visual');
    expect((root.textContent ?? '')).toContain('Fase 2 de 5');

    fixture.componentInstance.goTo(4);
    fixture.detectChanges();
    expect(fixture.componentInstance.isLast()).toBe(true);
    expect(root.querySelector('.flow__phase')?.textContent).toContain('Fin del programa');
    const lastNext = [...root.querySelectorAll('button')].find((node) => (node.textContent ?? '').includes('Siguiente'));
    expect(lastNext?.disabled).toBe(true);
  });
});

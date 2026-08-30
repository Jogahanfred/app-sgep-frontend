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
  it('muestra el flujo completo del PPL en solo lectura', async () => {
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
    expect(text).toContain('Inicio');
    expect(text).toContain('Fin del programa');
    expect(text).toContain('TEO · Teoría en aula');
    expect(text).toContain('BAS · Vuelo básico');
    expect(text).toContain('DUAL · Dual');
    expect(text).toContain('Circuito corto');
    expect(text).toContain('TOFF · Despegue');
    expect(text).toContain('Vuelo visual');
    expect(text).toContain('C17');
    expect(text).not.toContain('Añadir');
    expect(text).not.toContain('Guardar');
    expect(text).not.toContain('Editar fase');
    expect(root.querySelector('input')).toBeNull();
    expect(root.querySelector('form')).toBeNull();
    expect(root.querySelector('a[href="/catalogo/programas"]')).not.toBeNull();
  });
});

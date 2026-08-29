import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { WeightingFormPage } from './weighting-form.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<WeightingFormPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('WeightingFormPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('muestra estándar, unidad, escuadrón, programa, valor y vigencia', async () => {
    await TestBed.configureTestingModule({
      imports: [WeightingFormPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'w-toff-ppl' }, data: { mode: 'view' } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WeightingFormPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Detalle de ponderación');
    expect(text).toContain('Estándar');
    expect(text).toContain('Unidad');
    expect(text).toContain('Escuadrón');
    expect(text).toContain('Programa');
    expect(text).toContain('Valor ponderado');
    expect(text).toContain('Vigencia');
  });
});

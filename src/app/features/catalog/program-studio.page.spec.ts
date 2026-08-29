import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ProgramStudioPage } from './program-studio.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<ProgramStudioPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

function routeSnapshot(id: string | null, mode?: string) {
  return {
    snapshot: {
      paramMap: convertToParamMap(id ? { id } : {}),
      data: mode ? { mode } : {},
    },
  };
}

describe('ProgramStudioPage', () => {
  it('carga el itinerario PPL como un plan de estudios', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramStudioPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS, { provide: ActivatedRoute, useValue: routeSnapshot('prg-ppl', 'edit') }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStudioPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Diseñar plan de estudios');
    expect(text).toContain('Itinerario');
    expect(text).toContain('Teoría en aula');
    expect(text).toContain('Vuelo básico');
    expect(text).toContain('Aula');
    expect(text).toContain('Dual');
    expect(text).toContain('Manual');
    expect(text).toContain('Automático');
    expect(text).toContain('C1');
    expect(text).toContain('C17');
    expect(text).toContain('Añadir fase al itinerario');
    expect(text).toContain('Banco de fases');
    expect(text).toContain('Banco de subfases');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/catalogo/banco-fases"]')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/catalogo/banco-subfases"]')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('[id^="phase-bank-"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('[id^="sub-bank-"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('ui-table')).toBeNull();
  });

  it('permite empezar un programa vacío y añadir la primera fase', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramStudioPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS, { provide: ActivatedRoute, useValue: routeSnapshot(null) }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStudioPage);
    await waitReady(fixture);
    expect(fixture.componentInstance.phases().length).toBe(0);
    fixture.componentInstance.addPhase();
    fixture.detectChanges();
    expect(fixture.componentInstance.phases().length).toBe(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Fase 1');
  });
});

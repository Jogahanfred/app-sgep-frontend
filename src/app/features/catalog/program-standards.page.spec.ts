import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ProgramStandardsPage } from './program-standards.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<ProgramStandardsPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('ProgramStandardsPage', () => {
  it('carga los estándares del programa y deja marcar el catálogo', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramStandardsPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'prg-ppl' }), data: {} } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgramStandardsPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Estándares de Piloto privado · ala fija');
    expect(text).toContain('TOFF-01');
    expect(text).toContain('En el programa');
    expect(text).toContain('CRM-01');
    expect(fixture.componentInstance.checkedIds()).toEqual(['std-toff', 'std-land']);
    expect((fixture.nativeElement as HTMLElement).querySelector('ui-table')).not.toBeNull();
  });
});

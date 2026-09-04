import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { AcademicBankListPage } from './academic-bank-list.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<AcademicBankListPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('AcademicBankListPage', () => {
  it('lista el banco de fases como catálogo propio', async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicBankListPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        { provide: ActivatedRoute, useValue: { snapshot: { data: { bank: 'phase' } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AcademicBankListPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Banco de fases');
    expect(text).toContain('Teoría en aula');
    expect(text).toContain('Vuelo básico');
    expect(text).toContain('el programa solo lo asigna');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/catalogo/banco-fases/nuevo"]')).not.toBeNull();
  });

  it('lista el banco de subfases como catálogo propio', async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicBankListPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        { provide: ActivatedRoute, useValue: { snapshot: { data: { bank: 'subphase' } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AcademicBankListPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Banco de subfases');
    expect(text).toContain('Aula');
    expect(text).toContain('Dual');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/catalogo/banco-subfases/nuevo"]')).not.toBeNull();
  });
});

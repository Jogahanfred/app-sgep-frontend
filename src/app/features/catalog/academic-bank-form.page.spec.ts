import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { AcademicBankFormPage } from './academic-bank-form.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<AcademicBankFormPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('AcademicBankFormPage', () => {
  it('carga un banco de fase para editarlo fuera del programa', async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicBankFormPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'pb-teo' }),
              data: { bank: 'phase', mode: 'edit' },
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AcademicBankFormPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Editar banco de fase');
    expect(text).toContain('fuera del programa');
    expect(fixture.componentInstance.form.controls.code.value).toBe('TEO');
    expect(fixture.componentInstance.form.controls.name.value).toBe('Teoría en aula');
  });
});

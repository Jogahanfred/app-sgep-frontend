import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { CommissionFormPage } from './commission-form.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<CommissionFormPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('CommissionFormPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('muestra el timeline Registrado → Aprobado → Activo → Finalizado en el detalle', async () => {
    await TestBed.configureTestingModule({
      imports: [CommissionFormPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'com-pablo-academia' }, data: { mode: 'view' } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CommissionFormPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Detalle de comisión');
    expect(text).toContain('Registrado');
    expect(text).toContain('Aprobado');
    expect(text).toContain('Activo');
    expect(text).toContain('Finalizado');
    expect(text).toContain('Pasar a Finalizado');
    expect(fixture.nativeElement.querySelector('ui-steps')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ui-textarea textarea')).not.toBeNull();
  });
});


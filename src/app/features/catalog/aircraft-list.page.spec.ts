import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { AircraftListPage } from './aircraft-list.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<AircraftListPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('AircraftListPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AircraftListPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
  });

  it('muestra las aeronaves con foto, matrícula, flota, unidad y operativa', async () => {
    const fixture = TestBed.createComponent(AircraftListPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Aeronaves');
    expect(text).toContain('EC-HVA');
    expect(text).toContain('EC-HVC');
    expect(text).toContain('Matrícula');
    expect(text).toContain('Flota');
    expect(text).toContain('Unidad');
    expect(text).toContain('Operativa');
    expect(root.querySelector('img[src="/aircraft/ec-hva.jpg"]')).not.toBeNull();
    expect(root.querySelector('a[href="/catalogo/aeronaves/nuevo"]')).not.toBeNull();
  });
});

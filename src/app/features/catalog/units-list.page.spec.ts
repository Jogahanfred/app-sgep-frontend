import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { UnitsListPage } from './units-list.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<UnitsListPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('UnitsListPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitsListPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
  });

  it('lista las unidades operativas', async () => {
    const fixture = TestBed.createComponent(UnitsListPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Unidades');
    expect(text).toContain('U-NORTE');
    expect(text).toContain('Base Norte');
    expect(text).toContain('BN');
    expect(text).toContain('Añadir');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/catalogo/unidades/nuevo"]')).not.toBeNull();
  });
});

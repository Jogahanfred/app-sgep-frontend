import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { FleetsListPage } from './fleets-list.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<FleetsListPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('FleetsListPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FleetsListPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
  });

  it('lista las flotas de material aéreo', async () => {
    const fixture = TestBed.createComponent(FleetsListPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Flotas');
    expect(text).toContain('C152');
    expect(text).toContain('Ala fija');
    expect(text).toContain('Ala rotatoria');
    expect(text).toContain('UAS');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/catalogo/flotas/nuevo"]')).not.toBeNull();
  });
});

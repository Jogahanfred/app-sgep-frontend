import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { OperationsListPage } from './operations-list.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<OperationsListPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('OperationsListPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationsListPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
  });

  it('lista las operaciones de instrucción', async () => {
    const fixture = TestBed.createComponent(OperationsListPage);
    await waitReady(fixture);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Operaciones');
    expect(text).toContain('Vuelo visual');
    expect(text).toContain('Vuelo instrumental');
    expect(text).toContain('Añadir');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/catalogo/operaciones/nuevo"]')).not.toBeNull();
  });
});

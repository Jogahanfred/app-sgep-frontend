import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ProgramsBoardPage } from './programs-board.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<ProgramsBoardPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('ProgramsBoardPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramsBoardPage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
  });

  it('muestra los programas como planes de la academia, no como tabla', async () => {
    const fixture = TestBed.createComponent(ProgramsBoardPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Piloto privado · ala fija');
    expect(text).toContain('Habilitación instrumental');
    expect(text).toContain('Diseña un plan');
    expect(text).toContain('fases');
    expect(root.querySelector('ui-table')).toBeNull();
    expect(root.querySelector('a[href="/catalogo/programas/nuevo"]')).not.toBeNull();
  });
});

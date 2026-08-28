import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UiSigaLoader } from './ui-siga-loader';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

describe('UiSigaLoader', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiSigaLoader],
    }).compileComponents();
  });

  it('monta el escenario del Lottie del icono', async () => {
    const fixture = TestBed.createComponent(UiSigaLoader);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.siga-loader__stage')).not.toBeNull();
    expect(root.querySelector('.siga-loader')?.getAttribute('aria-label')).toBe('Cargando SIGA');
  });
});

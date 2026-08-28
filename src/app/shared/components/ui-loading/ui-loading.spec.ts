import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UiLoading } from './ui-loading';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

describe('UiLoading', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiLoading],
    }).compileComponents();
  });

  it('ocupa el padre, fondo blanco y monta el loader SIGA', async () => {
    const fixture = TestBed.createComponent(UiLoading);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const styles = getComputedStyle(host);
    expect(styles.display).toBe('block');
    expect(styles.width).not.toBe('');
    expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(host.querySelector('ui-siga-loader')).not.toBeNull();
    expect(host.querySelector('.ui-loading')?.getAttribute('aria-label')).toBe('Cargando SIGA');
  });

  it('muestra título y subtítulo cuando se informan', async () => {
    const fixture = TestBed.createComponent(UiLoading);
    fixture.componentRef.setInput('title', 'Guardando');
    fixture.componentRef.setInput('subtitle', 'Estamos actualizando tus datos personales.');
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Guardando');
    expect(text).toContain('Estamos actualizando tus datos personales.');
  });
});

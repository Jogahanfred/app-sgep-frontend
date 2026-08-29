import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS } from './catalog-form';
import { ItemFormPage } from './item-form.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

describe('ItemFormPage', () => {
  it('al crear sustituye el formulario por el loading y vuelve al listado con toast', async () => {
    await TestBed.configureTestingModule({
      imports: [ItemFormPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null }, data: { catalog: 'roles' } } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ItemFormPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.form.setValue({
      name: 'Coordinación de vuelo',
      description: 'Organiza las operaciones diarias',
      status: 'active',
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const success = vi.spyOn(TestBed.inject(ToastService), 'success');

    vi.useFakeTimers();
    try {
      const pending = page.save();
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      expect(page.creating()).toBe(true);
      expect(root.textContent).toContain('Creando rol');
      expect(root.querySelector('form')).toBeNull();
      expect(root.querySelector('.ap__table-wrap')).toBeNull();
      expect(root.querySelector('ui-loading.ap__loading')).not.toBeNull();
      await vi.advanceTimersByTimeAsync(CATALOG_CREATE_HOLD_MS);
      await pending;
    } finally {
      vi.useRealTimers();
    }

    expect(success).toHaveBeenCalledWith('Rol creado', 'El rol ya está disponible en el catálogo.');
    expect(navigate).toHaveBeenCalledWith(['/catalogo/roles']);
  });
});

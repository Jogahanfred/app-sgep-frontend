import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import { CATALOG_CREATE_HOLD_MS } from './catalog-form';
import { UserFormPage } from './user-form.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<UserFormPage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.loadState() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('UserFormPage', () => {
  it('es una pantalla de alta con pestañas, sin modal', async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null }, data: {} } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(UserFormPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Nuevo usuario');
    expect(text).toContain('Datos generales');
    expect(text).toContain('Roles');
    expect(text).toContain('Especialidades');
    expect(root.querySelector('app-modal')).toBeNull();
  });

  it('muestra el detalle en solo lectura, sin guardar', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [UserFormPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'usr-elena-martin' }, data: { mode: 'view' } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(UserFormPage);
    await waitReady(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Detalle de usuario');
    expect(text).toContain('no permite cambios');
    expect(text).not.toContain('Guardar cambios');
    expect(text).not.toContain('Contraseña');
    expect(text).toContain('04/03/2019');
    expect(root.querySelector('input:disabled')).not.toBeNull();
  });

  it('al crear sustituye el formulario por el loading y vuelve al listado con toast', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [UserFormPage],
      providers: [
        provideRouter([]),
        ...CORE_PROVIDERS,
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null }, data: {} } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(UserFormPage);
    await waitReady(fixture);
    const page = fixture.componentInstance;
    page.form.setValue({
      firstName: 'Nuria',
      lastName: 'Soler Vidal',
      email: 'nuria.soler@siga.demo',
      password: 'Helvia1!',
      documentNumber: '99887766B',
      entryDate: '2024-01-15',
      indicative: 'NUR-01',
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
      expect(root.textContent).toContain('Creando usuario');
      expect(root.querySelector('form')).toBeNull();
      expect(root.querySelector('.ap__table-wrap')).toBeNull();
      expect(root.querySelector('ui-loading.ap__loading')).not.toBeNull();
      await vi.advanceTimersByTimeAsync(CATALOG_CREATE_HOLD_MS);
      await pending;
    } finally {
      vi.useRealTimers();
    }

    expect(success).toHaveBeenCalledWith('Persona creada', 'La persona ya puede ingresar al sistema.');
    expect(navigate).toHaveBeenCalledWith(['/catalogo/usuarios']);
  });
});

import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ProfilePage } from './profile.page';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

async function waitReady(fixture: ComponentFixture<ProfilePage>): Promise<void> {
  fixture.detectChanges();
  const started = Date.now();
  while (fixture.componentInstance.status() === 'loading' && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
  }
  fixture.detectChanges();
}

describe('ProfilePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
  });

  it('carga el perfil de demostración y muestra las secciones', async () => {
    const fixture = TestBed.createComponent(ProfilePage);
    await waitReady(fixture);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Elena Martín Ruiz');
    expect(text).toContain('Foto');
    expect(text).toContain('Datos');
    expect(text).toContain('Correo y teléfono');
    expect(text).toContain('Contraseña');
    expect(text).not.toContain('Área cliente');
    expect(text).not.toContain('¿Dudas con tu perfil?');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-breadcrumb')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('ui-help')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('ui-segmented-control')).not.toBeNull();
  });

  it('muestra placeholders con icono en datos personales', async () => {
    const fixture = TestBed.createComponent(ProfilePage);
    await waitReady(fixture);
    fixture.componentInstance.select('data');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#pf-name')?.getAttribute('placeholder')).toBe('Tu nombre');
    expect(root.querySelector('ui-input app-icon')).not.toBeNull();
    expect(root.querySelector('input[type="date"]')).toBeNull();
  });

  it('cambia a la sección de correo', async () => {
    const fixture = TestBed.createComponent(ProfilePage);
    await waitReady(fixture);
    fixture.componentInstance.select('contact');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Correo electrónico');
    expect((fixture.nativeElement as HTMLElement).querySelector('#pf-email')?.getAttribute('placeholder')).toBe(
      'nombre@correo.com',
    );
  });

  it('guarda un correo válido desde el formulario', async () => {
    const fixture = TestBed.createComponent(ProfilePage);
    await waitReady(fixture);

    fixture.componentInstance.select('contact');
    fixture.componentInstance.contactForm.patchValue({
      email: 'elena.nueva@helvia.demo',
      phone: '699111222',
    });
    await fixture.componentInstance.saveContact();
    fixture.detectChanges();

    expect(fixture.componentInstance.profile()?.email).toBe('elena.nueva@helvia.demo');
    expect(fixture.componentInstance.notice()).toContain('Correo y teléfono');
  });

  it('muestra el loading encima de la tarjeta al guardar datos', async () => {
    const fixture = TestBed.createComponent(ProfilePage);
    await waitReady(fixture);
    fixture.componentInstance.select('data');
    fixture.componentInstance.saving.set(true);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.pf__card ui-loading')).not.toBeNull();
    expect(root.textContent).toContain('Guardando');
    expect(root.textContent).toContain('datos personales');
  });
});

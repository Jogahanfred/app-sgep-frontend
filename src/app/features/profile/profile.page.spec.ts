import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CORE_PROVIDERS } from '@core/di/providers';
import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
    }).compileComponents();
  });

  it('carga el perfil de demostración y muestra las secciones', async () => {
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Elena Martín Ruiz');
    expect(text).toContain('Foto');
    expect(text).toContain('Datos');
    expect(text).toContain('Correo y teléfono');
    expect(text).toContain('Contraseña');
  });

  it('cambia a la sección de correo', async () => {
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.select('contact');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Correo electrónico');
  });

  it('guarda un correo válido desde el formulario', async () => {
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

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
});

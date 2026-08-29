import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('muestra la marca y los CTA principales', async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    const logo = (fixture.nativeElement as HTMLElement).querySelector('.logo__sgcp');
    expect(logo?.getAttribute('src')).toBe('/logo-sgcp.svg');
    expect(logo?.getAttribute('alt')).toBe('SIGA');
    expect((fixture.nativeElement as HTMLElement).querySelector('.logo__text')).toBeNull();
    expect(text).toContain('Acceso clientes');
    expect(text).toContain('Hazte cliente');
    expect(text).toContain('Particulares');
    expect(text).toContain('Configuración');
    expect(text).not.toContain('Instrucción');
  });

  it('muestra el chip de cliente tras el acceso demo', async () => {
    const fixture = TestBed.createComponent(Header);
    fixture.componentInstance.session.signIn('Elena');
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.userchip')?.textContent).toContain('Elena');
    expect(root.querySelector('.header__login')).toBeNull();
    expect(root.textContent).not.toContain('Cerrar sesión');

    fixture.componentInstance.toggleUserMenu();
    fixture.detectChanges();
    expect(root.textContent).toContain('Mi perfil');
    expect(root.textContent).toContain('Cerrar sesión');
  });

  it('abre el menú móvil', async () => {
    const fixture = TestBed.createComponent(Header);
    const component = fixture.componentInstance;
    expect(component.mobileOpen()).toBe(false);
    component.toggleMobile();
    expect(component.mobileOpen()).toBe(true);
  });

  it('abre el mega menú de Particulares al activar la opción', async () => {
    const fixture = TestBed.createComponent(Header);
    const component = fixture.componentInstance;
    component.setMega('Particulares');
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.openGroup()?.label).toBe('Particulares');
    expect(text).toContain('Cuentas');
    expect(text).toContain('Hipotecas');
    expect(text).toContain('Préstamos');
  });

  it('abre Configuración y muestra Catálogos debajo', async () => {
    const fixture = TestBed.createComponent(Header);
    const component = fixture.componentInstance;
    component.setMega('Configuración');
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(component.openGroup()?.label).toBe('Configuración');
    expect(text).toContain('Catálogos');
    expect(text).toContain('Usuarios');
    expect(text).toContain('Roles');
    expect(text).toContain('Especialidades');
    expect(text).toContain('Estructura operativa');
    expect(text).toContain('Unidades');
    expect(text).toContain('Operaciones');
    expect(text).toContain('Tipo de misión');
    expect(text).toContain('Maniobras');
    expect(text).toContain('Estándares');
    expect(text).toContain('Ponderaciones');
    expect(text).not.toContain('Ver operaciones');
    expect(text).not.toContain('Nueva operación');
    expect(text).not.toContain('Ver tipos de misión');
    expect(text).not.toContain('Nuevo tipo de misión');
    expect(text).not.toContain('Ver maniobras');
    expect(text).not.toContain('Nueva maniobra');
    expect(text).not.toContain('Ver estándares');
    expect(text).not.toContain('Nuevo estándar');
    expect(text).not.toContain('Ver ponderaciones');
    expect(text).not.toContain('Nueva ponderación');
    expect(text).toContain('Material aéreo');
    expect(text).toContain('Aeronaves');
    expect(root.querySelector('.mega__title')?.textContent).toContain('Configuración');
    expect(root.querySelectorAll('.mega__col').length).toBe(3);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  beforeEach(async () => {
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
});

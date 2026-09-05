import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CORE_PROVIDERS } from '@core/di/providers';
import { Header } from './header';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

describe('Header', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function showModal() {
        this.setAttribute('open', '');
      };
      HTMLDialogElement.prototype.close = function close() {
        this.removeAttribute('open');
      };
    }
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), ...CORE_PROVIDERS],
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
    expect(text).not.toContain('Hazte cliente');
    expect(text).not.toContain('Español');
    expect(text).toContain('Dashboard');
    expect(text).toContain('Administración');
    expect(text).toContain('Catálogos');
    expect(text).toContain('Programación');
    expect(text).toContain('Misiones');
    expect(text).toContain('Calificaciones');
    expect(text).toContain('Reportes');
    expect(text).not.toContain('Incidencias');
    expect(text).not.toContain('Particulares');
    expect(text).not.toContain('Configuración');
    expect(text).not.toContain('Instrucción');
  });

  it('muestra el chip de cliente tras el acceso demo', async () => {
    const fixture = TestBed.createComponent(Header);
    fixture.componentInstance.session.signIn('Elena');
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.userchip')?.textContent).toContain('Elena');
    expect(root.querySelector('.userchip__chev')).toBeTruthy();
    expect(root.querySelector('.userchip__chev--up')).toBeNull();
    expect(root.querySelector('.header__login')).toBeNull();
    expect(root.textContent).not.toContain('Cerrar sesión');

    fixture.componentInstance.toggleUserMenu();
    fixture.detectChanges();
    expect(root.querySelector('.userchip__chev--up')).toBeTruthy();
    expect(root.textContent).toContain('Mi perfil');
    expect(root.textContent).toContain('Cerrar sesión');
  });

  it('abre la pantalla de acceso institucional', async () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    await fixture.whenStable();

    const login = (fixture.nativeElement as HTMLElement).querySelector('.header__login');
    expect(login?.getAttribute('href')).toBe('/login');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-login-screen')).toBeNull();
  });

  it('muestra los logos de unidad y escuadrón con su nombre', async () => {
    const fixture = TestBed.createComponent(Header);
    fixture.componentInstance.session.confirmContext(
      {
        userId: 'usr-elena-martin',
        displayName: 'Elena Martín Ruiz',
        roleCode: 'ADSYS',
        assignedUnitId: null,
        assignedSquadronId: null,
        unitId: 'unit-ga-51',
        squadronId: 'sq-ea-510',
        coversAllSquadrons: false,
      },
      {
        unitName: 'Grupo Aéreo N.º 51',
        unitImageUrl: '/emblems/units/grupo-aereo-51.jpg',
        squadronName: 'Escuadrón Aéreo 510',
        squadronImageUrl: '/emblems/squadrons/ea-510.png',
      },
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const logos = root.querySelectorAll('.context-emblems__item');
    expect(logos.length).toBe(2);
    expect(logos[0]?.getAttribute('title')).toBe('Grupo Aéreo N.º 51');
    expect(logos[1]?.getAttribute('title')).toBe('Escuadrón Aéreo 510');
    expect(root.querySelector('.context-emblems__pick')).toBeNull();
  });

  it('ofrece elegir escuadrón en el header si el rol aún no tiene uno', async () => {
    const fixture = TestBed.createComponent(Header);
    fixture.componentInstance.session.confirmContext(
      {
        userId: 'usr-elena-martin',
        displayName: 'Elena Martín Ruiz',
        roleCode: 'ADSYS',
        assignedUnitId: null,
        assignedSquadronId: null,
        unitId: 'unit-ga-51',
        squadronId: null,
        coversAllSquadrons: true,
      },
      {
        unitName: 'Grupo Aéreo N.º 51',
        unitImageUrl: '/emblems/units/grupo-aereo-51.jpg',
        squadronName: null,
        squadronImageUrl: null,
      },
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.context-emblems__pick')).toBeTruthy();
    fixture.componentInstance.openSquadronModal();
    fixture.detectChanges();
    expect(fixture.componentInstance.squadronModalOpen()).toBe(true);
  });

  it('abre el menú móvil', async () => {
    const fixture = TestBed.createComponent(Header);
    const component = fixture.componentInstance;
    expect(component.mobileOpen()).toBe(false);
    component.toggleMobile();
    expect(component.mobileOpen()).toBe(true);
  });

  it('abre el mega menú de Administración', async () => {
    const fixture = TestBed.createComponent(Header);
    const component = fixture.componentInstance;
    component.setMega('Administración');
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.openGroup()?.label).toBe('Administración');
    expect(text).toContain('Acceso y seguridad');
    expect(text).toContain('Usuarios');
    expect(text).toContain('Organización');
    expect(text).toContain('Unidades');
    expect(text).toContain('Escuadrones');
  });

  it('abre Catálogos y muestra los bancos y recursos existentes', async () => {
    const fixture = TestBed.createComponent(Header);
    const component = fixture.componentInstance;
    component.setMega('Catálogos');
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(component.openGroup()?.label).toBe('Catálogos');
    expect(text).toContain('Académico');
    expect(text).toContain('Programas');
    expect(text).toContain('Estándares');
    expect(text).toContain('Operaciones');
    expect(text).toContain('Tipos de Misión');
    expect(text).toContain('Bancos académicos');
    expect(text).toContain('Banco de Fases');
    expect(text).toContain('Banco de Subfases');
    expect(text).toContain('Banco de Maniobras');
    expect(text).toContain('Recursos');
    expect(text).toContain('Flotas');
    expect(text).toContain('Aeronaves');
    expect(text).not.toContain('Constructor curricular');
    expect(text).not.toContain('Estudio de programa');
    expect(text).not.toContain('Flujo de programa');
    expect(text).not.toContain('Particulares');
    expect(text).not.toContain('Hazte cliente');
    expect(root.querySelector('.mega__title')?.textContent).toContain('Catálogos');
    expect(root.querySelectorAll('.mega__col').length).toBe(3);
  });

  it('abre Programación con las pantallas reales, sin alias', async () => {
    const fixture = TestBed.createComponent(Header);
    const component = fixture.componentInstance;
    component.setMega('Programación');
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Promociones');
    expect(text).toContain('Matrícula');
    expect(text).toContain('Orden de vuelo y asignación');
    expect(text).toContain('Programación y despacho diario');
    expect(text).not.toContain('Programación y asignación de misiones');
    expect(text).not.toContain('Programación y matrícula');
    expect(text).not.toContain('Programación de entrenamiento');
    expect(text).not.toContain('Programación PDE');
    expect(text).not.toContain('Matricular promoción');
    expect(text).not.toContain('Matricular alumno');
  });

  it('colorea en el header la sección de la ruta actual', async () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.currentUrl.set('/');
    fixture.detectChanges();
    expect(root.querySelector('.nav__link.is-active')?.textContent?.trim()).toBe('Dashboard');

    fixture.componentInstance.currentUrl.set('/catalogo/usuarios');
    fixture.detectChanges();
    expect(root.querySelector('.nav__link.is-active')?.textContent?.trim()).toBe('Administración');
  });
});

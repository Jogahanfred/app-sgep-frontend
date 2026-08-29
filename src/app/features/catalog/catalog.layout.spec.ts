import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CatalogLayout } from './catalog.layout';

@Component({
  standalone: true,
  template: '',
})
class BlankPage {}

describe('CatalogLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogLayout],
      providers: [
        provideRouter([
          { path: 'catalogo/roles', component: BlankPage },
          { path: 'catalogo/roles/nuevo', component: BlankPage },
          { path: 'catalogo/unidades', component: BlankPage },
          { path: 'catalogo/comisiones-temporales', component: BlankPage },
          { path: 'catalogo/operaciones', component: BlankPage },
          { path: 'catalogo/ponderaciones/nuevo', component: BlankPage },
          { path: 'catalogo/ponderaciones/:id/editar', component: BlankPage },
          { path: 'catalogo/aeronaves', component: BlankPage },
          { path: 'catalogo/aeronaves/nuevo', component: BlankPage },
        ]),
      ],
    }).compileComponents();
  });

  it('muestra solo Catálogo en usuarios, roles y especialidades', () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Catálogo');
    expect(text).toContain('Usuarios');
    expect(text).toContain('Roles');
    expect(text).toContain('Especialidades');
    expect(text).toContain('Mi perfil');
    expect(text).not.toContain('Estructura operativa');
    expect(text).not.toContain('Unidades');
    expect(root.querySelectorAll('h1.adm__kicker').length).toBe(1);
    expect(text).not.toContain('Sprint');
  });

  it('muestra solo Estructura operativa en unidades, escuadrones y comisiones', async () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/catalogo/comisiones-temporales');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Estructura operativa');
    expect(text).toContain('Unidades');
    expect(text).toContain('Escuadrones');
    expect(text).toContain('Comisiones temporales');
    expect(text).toContain('dónde opera el personal');
    expect(text).not.toContain('Catálogo');
    expect(text).not.toContain('Usuarios');
    expect(root.querySelectorAll('.adm__kicker').length).toBe(1);
  });

  it('oculta el cambio de dominio mientras se crea un registro', async () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/catalogo/roles/nuevo');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('nav[aria-label="Catálogo"]')).toBeNull();
    expect(root.querySelector('nav[aria-label="Estructura operativa"]')).toBeNull();
    expect(root.querySelector('.adm__kicker')).toBeNull();
    expect(root.textContent).not.toContain('Catálogo');
    expect(root.textContent).not.toContain('Estructura operativa');
  });

  it('oculta el título del padre al crear o editar instrucción', async () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/catalogo/ponderaciones/nuevo');
    fixture.detectChanges();
    const createText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(createText).not.toContain('Catálogos de instrucción');
    expect(createText).not.toContain('catálogos maestros');
    expect((fixture.nativeElement as HTMLElement).querySelector('.adm__kicker')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('nav[aria-label="Catálogos de instrucción"]')).toBeNull();

    await router.navigateByUrl('/catalogo/ponderaciones/wgt-1/editar');
    fixture.detectChanges();
    const editText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(editText).not.toContain('Catálogos de instrucción');
    expect(editText).not.toContain('catálogos maestros');
    expect((fixture.nativeElement as HTMLElement).querySelector('.adm__kicker')).toBeNull();
  });

  it('muestra solo Catálogos de instrucción en operaciones y maestros', async () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/catalogo/operaciones');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Catálogos de instrucción');
    expect(text).toContain('Operaciones');
    expect(text).toContain('Tipo de misión');
    expect(text).toContain('Maniobras');
    expect(text).toContain('Estándares');
    expect(text).toContain('Ponderaciones');
    expect(text).not.toContain('Usuarios');
    expect(text).not.toContain('Estructura operativa');
    expect(root.querySelectorAll('.adm__kicker').length).toBe(1);
  });

  it('muestra solo Gestión de material aéreo en flotas y aeronaves', async () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/catalogo/aeronaves');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Gestión de material aéreo');
    expect(text).toContain('Flotas');
    expect(text).toContain('Aeronaves');
    expect(text).toContain('matrículas');
    expect(text).not.toContain('Usuarios');
    expect(text).not.toContain('Estructura operativa');
    expect(text).not.toContain('Catálogos de instrucción');
    expect(root.querySelectorAll('.adm__kicker').length).toBe(1);
  });
});

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CatalogLayout } from './catalog.layout';
import { CATALOG_PAGE_HEADERS } from '../../../constants/catalog-section.constants';

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
          { path: 'catalogo/operaciones', component: BlankPage },
          { path: 'catalogo/aeronaves', component: BlankPage },
          { path: 'catalogo/programas', component: BlankPage },
          { path: 'catalogo/ejecucion-misiones', component: BlankPage },
          { path: 'catalogo/despacho-diario', component: BlankPage },
          { path: 'catalogo/orden-de-vuelo', component: BlankPage },
          { path: 'catalogo/matricula/asignacion', component: BlankPage },
          { path: 'catalogo/programacion-entrenamiento/grupal/nuevo', component: BlankPage },
          { path: 'catalogo/programacion-entrenamiento/individual/nuevo', component: BlankPage },
        ]),
      ],
    }).compileComponents();
  });

  it('muestra el título del catálogo elegido, sin pestañas', async () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/catalogo/roles');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Roles y Permisos');
    expect(root.querySelector('nav')).toBeNull();
    expect(root.querySelectorAll('h1.adm__kicker').length).toBe(1);

    await router.navigateByUrl('/catalogo/unidades');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Unidades');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Roles y Permisos');
  });

  it('oculta el encabezado al crear un registro', async () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/catalogo/roles/nuevo');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.adm__kicker')).toBeNull();
    expect(root.textContent).not.toContain('Roles y Permisos');
  });

  it('usa el nombre de cada pantalla en operaciones, aeronaves, programas y misiones', async () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/catalogo/operaciones');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Operaciones');

    await router.navigateByUrl('/catalogo/aeronaves');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aeronaves');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Operaciones');

    await router.navigateByUrl('/catalogo/programas');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Programas');

    await router.navigateByUrl('/catalogo/ejecucion-misiones');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ejecución y calificación');

    await router.navigateByUrl('/catalogo/despacho-diario');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Programación y despacho diario');

    await router.navigateByUrl('/catalogo/orden-de-vuelo');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Generación de orden de vuelo y asignación');
  });

  it('conserva el encabezado de Matrícula en el listado y en los formularios', async () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const header = CATALOG_PAGE_HEADERS['matricula'];

    await router.navigateByUrl('/catalogo/matricula/asignacion');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(header.title);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(header.lead);

    await router.navigateByUrl('/catalogo/programacion-entrenamiento/grupal/nuevo');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(header.title);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(header.lead);

    await router.navigateByUrl('/catalogo/programacion-entrenamiento/individual/nuevo');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(header.title);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(header.lead);
  });
});

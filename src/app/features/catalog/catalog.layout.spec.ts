import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CatalogLayout } from './catalog.layout';

describe('CatalogLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogLayout],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('separa el catálogo de la cuenta personal', () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Catálogo');
    expect(text).toContain('Usuarios');
    expect(text).toContain('Roles');
    expect(text).toContain('Especialidades');
    expect(text).toContain('Mi perfil');
    expect(text).not.toContain('Sprint');
  });

  it('oculta el cambio de dominio mientras se crea un registro', async () => {
    const fixture = TestBed.createComponent(CatalogLayout);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/catalogo/roles/nuevo');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('nav[aria-label="Catálogo"]')).toBeNull();
    expect(root.textContent).toContain('Catálogo');
  });
});

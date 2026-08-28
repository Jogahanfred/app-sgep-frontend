import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CatalogLayout } from './catalog.layout';

describe('CatalogLayout', () => {
  it('separa el catálogo de la cuenta personal', async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogLayout],
      providers: [provideRouter([])],
    }).compileComponents();

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
});

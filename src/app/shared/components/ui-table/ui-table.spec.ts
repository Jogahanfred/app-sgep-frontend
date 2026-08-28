import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { UiTable, type UiTableColumn, type UiTableRow } from './ui-table';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({
      destroy: () => undefined,
      goToAndPlay: () => undefined,
    }),
  },
}));

const COLUMNS: UiTableColumn[] = [
  { id: 'name', header: 'Nombre' },
  { id: 'status', header: 'Estado' },
  { id: 'action', header: '', align: 'right' },
];

function rows(count: number): UiTableRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `row-${index + 1}`,
    cells: {
      name: `Persona ${index + 1}`,
      status: { text: index % 2 === 0 ? 'Activo' : 'Inactivo', badge: index % 2 === 0 ? 'active' : 'inactive' },
      action: { text: 'Editar', href: `/catalogo/usuarios/row-${index + 1}` },
    },
  }));
}

describe('UiTable', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiTable],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('pagina las filas y el control Mostrar cambia el tamaño de página', () => {
    const fixture = TestBed.createComponent(UiTable);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', rows(8));
    fixture.componentRef.setInput('caption', 'Personas');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Mostrar');
    expect(root.textContent).toContain('Mostrando 1–5 de 8');
    expect(root.textContent).toContain('Persona 1');
    expect(root.textContent).toContain('Persona 5');
    expect(root.textContent).not.toContain('Persona 6');

    const next = root.querySelector('[aria-label="Página siguiente"]') as HTMLButtonElement;
    next.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Persona 6');
    expect(root.textContent).toContain('Mostrando 6–8 de 8');
    expect(root.textContent).not.toContain('Persona 1');

    const select = root.querySelector('select') as HTMLSelectElement;
    select.value = '10';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(root.textContent).toContain('Mostrando 1–8 de 8');
    expect(root.textContent).toContain('Persona 1');
    expect(root.textContent).toContain('Persona 8');
  });

  it('muestra el estado vacío y el de carga', () => {
    const fixture = TestBed.createComponent(UiTable);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('emptyTitle', 'No hay personas que coincidan.');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay personas que coincidan.');
    expect((fixture.nativeElement as HTMLElement).querySelector('select')).toBeNull();

    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('loadingTitle', 'Cargando usuarios');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando usuarios');
  });
});

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

  it('pagina las filas y el control Por página cambia el tamaño de página', () => {
    const fixture = TestBed.createComponent(UiTable);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', rows(32));
    fixture.componentRef.setInput('heading', 'Resultado de valoraciones');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Resultado de valoraciones');
    expect(root.textContent).toContain('Por página:');
    expect(root.textContent).toContain('Mostrando 1 - 10 de 32');
    expect(root.textContent).toContain('Persona 1');
    expect(root.textContent).toContain('Persona 10');
    expect(root.textContent).not.toContain('Persona 11');
    expect(root.querySelector('[aria-label="Primera página"]')).not.toBeNull();
    expect(root.querySelector('[aria-label="Última página"]')).not.toBeNull();

    const next = root.querySelector('[aria-label="Página siguiente"]') as HTMLButtonElement;
    next.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Persona 11');
    expect(root.textContent).toContain('Mostrando 11 - 20 de 32');
    expect(root.textContent).not.toContain('Persona 10');

    const last = root.querySelector('[aria-label="Última página"]') as HTMLButtonElement;
    last.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Mostrando 31 - 32 de 32');

    const size = root.querySelector('[aria-label="Filas por página"]') as HTMLButtonElement;
    size.click();
    fixture.detectChanges();
    const selected = root.querySelector('[role="option"][aria-selected="true"]') as HTMLButtonElement;
    expect(selected.textContent).toContain('10');
    expect(selected.querySelector('.sm__mark')).not.toBeNull();
    const option = Array.from(root.querySelectorAll('[role="option"]')).find((node) =>
      (node.textContent ?? '').includes('20'),
    ) as HTMLButtonElement;
    option.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Mostrando 1 - 20 de 32');
    expect(root.textContent).toContain('Persona 1');
    expect(root.textContent).toContain('Persona 20');
  });

  it('muestra el estado vacío y el de carga', () => {
    const fixture = TestBed.createComponent(UiTable);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('emptyTitle', 'No hay personas que coincidan.');
    fixture.detectChanges();
    const emptyRoot = fixture.nativeElement as HTMLElement;
    expect(emptyRoot.textContent).toContain('No hay personas que coincidan.');
    expect(emptyRoot.textContent).toContain('Nombre');
    expect(emptyRoot.textContent).toContain('Estado');
    expect(emptyRoot.querySelector('thead')).not.toBeNull();
    expect(emptyRoot.querySelector('.ui-table__grid--empty')).not.toBeNull();
    expect(emptyRoot.querySelector('.ui-table__empty-row')).not.toBeNull();
    expect(emptyRoot.querySelector('.ui-table__empty-icon')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('[aria-label="Filas por página"]')).toBeNull();

    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('loadingTitle', 'Cargando usuarios');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando usuarios');
  });

  it('muestra la miniatura cuando la celda trae imagen', () => {
    const fixture = TestBed.createComponent(UiTable);
    fixture.componentRef.setInput('columns', [{ id: 'reg', header: 'Matrícula', align: 'left' }]);
    fixture.componentRef.setInput('rows', [
      { id: 'ac-1', cells: { reg: { text: 'EC-HVA', image: '/aircraft/ec-hva.jpg', imageAlt: 'Aeronave EC-HVA' } } },
    ]);
    fixture.detectChanges();
    const img = (fixture.nativeElement as HTMLElement).querySelector('img') as HTMLImageElement | null;
    expect(img?.getAttribute('src')).toBe('/aircraft/ec-hva.jpg');
    expect(img?.getAttribute('alt')).toBe('Aeronave EC-HVA');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('EC-HVA');
  });
});


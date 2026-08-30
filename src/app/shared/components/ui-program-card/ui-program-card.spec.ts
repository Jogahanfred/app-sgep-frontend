import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UiProgramCard } from './ui-program-card';

describe('UiProgramCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiProgramCard],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('pinta un programa con portada, tipo y métricas', () => {
    const fixture = TestBed.createComponent(UiProgramCard);
    fixture.componentRef.setInput('href', '/catalogo/programas/prg-ppl/editar');
    fixture.componentRef.setInput('title', 'Piloto privado · ala fija');
    fixture.componentRef.setInput('kicker', 'PPL-AF · PPL · Piloto privado');
    fixture.componentRef.setInput('description', 'Formación inicial.');
    fixture.componentRef.setInput('imageUrl', '/programs/ppl.jpg');
    fixture.componentRef.setInput('imageAlt', 'Portada de Piloto privado · ala fija');
    fixture.componentRef.setInput('typeBadge', 'PPL');
    fixture.componentRef.setInput('status', 'active');
    fixture.componentRef.setInput('statusLabel', 'Activo');
    fixture.componentRef.setInput('stats', ['5 fases', '8 subfases', '45 h']);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('a.pcard__main')?.getAttribute('href')).toBe('/catalogo/programas/prg-ppl/editar');
    expect(root.textContent).toContain('Piloto privado · ala fija');
    expect(root.textContent).toContain('5 fases');
    expect(root.querySelector('img')?.getAttribute('src')).toBe('/programs/ppl.jpg');
    expect(root.textContent).not.toContain('Asignar estándares');
  });

  it('habilita el botón para asignar estándares', () => {
    const fixture = TestBed.createComponent(UiProgramCard);
    fixture.componentRef.setInput('href', '/catalogo/programas/prg-ppl/editar');
    fixture.componentRef.setInput('title', 'Piloto privado · ala fija');
    fixture.componentRef.setInput('standardsHref', '/catalogo/programas/prg-ppl/estandares');
    fixture.componentRef.setInput('standardsEnabled', true);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const action = root.querySelector('.pcard__actions a.btn') as HTMLAnchorElement | null;
    expect(action).not.toBeNull();
    expect(action?.textContent).toContain('Asignar estándares');
    expect(action?.getAttribute('href')).toBe('/catalogo/programas/prg-ppl/estandares');
    expect(action?.classList.contains('btn--disabled')).toBe(false);
  });

  it('pinta la variante para crear un plan', () => {
    const fixture = TestBed.createComponent(UiProgramCard);
    fixture.componentRef.setInput('href', '/catalogo/programas/nuevo');
    fixture.componentRef.setInput('title', 'Diseña un plan');
    fixture.componentRef.setInput('description', 'Crea un itinerario.');
    fixture.componentRef.setInput('variant', 'create');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.pcard--create')).not.toBeNull();
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('Diseña un plan');
  });
});

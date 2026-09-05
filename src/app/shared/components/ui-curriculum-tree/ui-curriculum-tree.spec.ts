import { TestBed } from '@angular/core/testing';
import { UiCurriculumTree } from './ui-curriculum-tree';

describe('UiCurriculumTree', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiCurriculumTree],
    }).compileComponents();
  });

  it('muestra el programa y permite elegir una misión disponible', () => {
    const fixture = TestBed.createComponent(UiCurriculumTree);
    fixture.componentRef.setInput('programTitle', 'Curso piloto');
    fixture.componentRef.setInput('programMeta', '24 h planificadas');
    fixture.componentRef.setInput('selectedId', 'mt-a');
    fixture.componentRef.setInput('phases', [
      {
        id: 'ph-1',
        title: 'Fase 1',
        meta: '4 h',
        progressLabel: '1 / 2',
        subphases: [
          {
            id: 'sp-1',
            title: 'Subfase 1',
            missions: [
              {
                id: 'mt-a',
                code: 'C-01',
                title: 'Familiarización',
                detail: '1.5 h',
                status: 'available',
                statusLabel: 'Disponible',
                scoreLabel: '',
                actionLabel: 'Programar',
              },
            ],
          },
        ],
      },
    ]);
    fixture.detectChanges();
    const picked: string[] = [];
    fixture.componentInstance.selectedChange.subscribe((id) => picked.push(id));
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Curso piloto');
    expect(root.querySelector('.ct__subphase')).not.toBeNull();
    expect(root.querySelector('.ct__missions')).not.toBeNull();
    expect(root.textContent).toContain('Familiarización');
    expect(root.textContent).toContain('Subfase 1');
    (root.querySelector('.ct__mission-main') as HTMLButtonElement).click();
    expect(picked).toEqual(['mt-a']);
  });

  it('muestra Programar, Actualizar y ninguna acción según el estado', () => {
    const fixture = TestBed.createComponent(UiCurriculumTree);
    fixture.componentRef.setInput('programTitle', 'Aire');
    fixture.componentRef.setInput('phases', [
      {
        id: 'ph-1',
        title: 'Briefing',
        meta: '4 h',
        progressLabel: '1 / 3',
        subphases: [
          {
            id: 'sp-1',
            title: 'Briefing (4 h)',
            missions: [
              {
                id: 'mt-scheduled',
                code: 'LOC',
                title: 'Misión local',
                detail: '4 h',
                status: 'scheduled',
                statusLabel: 'Programada',
                scoreLabel: '',
                actionLabel: 'Actualizar orden',
              },
              {
                id: 'mt-available',
                code: 'NAV',
                title: 'Navegación',
                detail: '4 h',
                status: 'available',
                statusLabel: 'Disponible',
                scoreLabel: '',
                actionLabel: 'Programar',
              },
              {
                id: 'mt-blocked',
                code: 'IFR',
                title: 'Instrumental',
                detail: '6 h',
                status: 'blocked',
                statusLabel: 'Bloqueada',
                scoreLabel: '',
                actionLabel: '',
              },
            ],
          },
        ],
      },
    ]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const cards = root.querySelectorAll('.ct__mission');
    expect(cards).toHaveLength(3);
    expect(cards[0]?.textContent).toContain('Actualizar orden');
    expect(cards[1]?.textContent).toContain('Programar');
    expect(cards[2]?.textContent).not.toContain('Programar');
    expect(cards[2]?.textContent).not.toContain('Actualizar orden');
    expect((cards[2]?.querySelector('.ct__mission-main') as HTMLButtonElement).disabled).toBe(true);
    const scheduled: string[] = [];
    fixture.componentInstance.scheduleClick.subscribe((id) => scheduled.push(id));
    (cards[1]?.querySelector('.ct__action') as HTMLElement).querySelector('button')?.click();
    expect(scheduled).toEqual(['mt-available']);
  });

  it('en un curso plano lista las evaluaciones sin subfase intermedia', () => {
    const fixture = TestBed.createComponent(UiCurriculumTree);
    fixture.componentRef.setInput('programTitle', 'Tierra');
    fixture.componentRef.setInput('phases', [
      {
        id: 'ph-aero',
        title: 'Aerodinámica',
        meta: 'NA = PE (0,6) + PT (0,4)',
        progressLabel: '100%',
        subphases: [
          {
            id: 'sp-aero',
            title: '',
            missions: [
              {
                id: 't-1',
                code: 'T-1',
                title: 'Trabajo 1',
                detail: 'Nota: 18',
                status: 'completed',
                statusLabel: 'Completada',
                scoreLabel: '18',
                actionLabel: '',
              },
            ],
          },
        ],
      },
    ]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Aerodinámica');
    expect(root.textContent).toContain('Trabajo 1');
    expect(root.querySelector('.ct__sub-head')).toBeNull();
    expect(root.querySelector('.ct__missions--flush')).not.toBeNull();
  });

  it('marca un curso de tierra con el checkbox de la cabecera', () => {
    const fixture = TestBed.createComponent(UiCurriculumTree);
    fixture.componentRef.setInput('programTitle', 'Tierra');
    fixture.componentRef.setInput('phases', [
      {
        id: 'sp-prf',
        title: 'Procedimientos de Vuelo',
        meta: '14 h · Pendiente',
        progressLabel: 'Pendiente',
        selectable: true,
        selected: false,
        selectDisabled: false,
        subphases: [{ id: 'sp-prf-evals', title: '', missions: [] }],
      },
    ]);
    fixture.detectChanges();
    const emitted: { id: string; selected: boolean }[] = [];
    fixture.componentInstance.phaseSelectChange.subscribe((value) => emitted.push(value));
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('ui-checkbox')).not.toBeNull();
    expect(root.querySelector('.ct__missions')).toBeNull();
    const input = root.querySelector('#ct-course-sp-prf') as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([{ id: 'sp-prf', selected: true }]);
  });

  it('muestra un mensaje cuando el curso abierto no tiene evaluaciones', () => {
    const fixture = TestBed.createComponent(UiCurriculumTree);
    fixture.componentRef.setInput('programTitle', 'Tierra');
    fixture.componentRef.setInput('emptyLabel', 'Este curso no tiene evaluaciones para mostrar.');
    fixture.componentRef.setInput('phases', [
      {
        id: 'sp-empty',
        title: 'Curso vacío',
        meta: '0 h',
        progressLabel: '0%',
        selectable: true,
        selected: true,
        selectDisabled: false,
        subphases: [{ id: 'sp-empty-evals', title: '', missions: [] }],
      },
    ]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Este curso no tiene evaluaciones para mostrar.');
  });
});

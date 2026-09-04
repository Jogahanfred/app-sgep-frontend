import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  standardCellKey,
  type ProgramStandardSubphaseView,
} from '../../shared/models/program-standard-matrix.types';
import { ProgramStandardMatrix } from './program-standard-matrix';

const subphase: ProgramStandardSubphaseView = {
  id: 'subphase-1',
  phaseId: 'phase-1',
  code: 'C',
  name: 'Contacto',
  label: 'C · Contacto',
  hours: 2,
  missions: [
    {
      key: 'mission-1',
      typeCode: 'DM',
      code: 'C-1',
      name: 'Contacto 1',
      label: 'C-1 · Contacto 1',
      detail: 'Primera misión de contacto.',
      kindLabel: 'Serie',
    },
  ],
  maneuvers: [
    {
      id: 'maneuver-1',
      code: 'BRF',
      name: 'Briefing de la misión',
      description: 'Preparación previa al vuelo.',
      operationId: 'ground',
      operationName: 'Operación en tierra',
    },
    {
      id: 'maneuver-2',
      code: 'TOFF',
      name: 'Despegue',
      description: 'Despegue y transición inicial.',
      operationId: 'air',
      operationName: 'Operación en el aire',
    },
  ],
  configuredCells: 1,
  totalCells: 2,
  levelsUsed: 1,
  percentage: 50,
  hasMatrix: true,
  matrixHint: '',
};

const axisSubphase: ProgramStandardSubphaseView = {
  ...subphase,
  missions: [
    ...subphase.missions,
    {
      key: 'mission-2',
      typeCode: 'DM',
      code: 'C-2',
      name: 'Contacto 2',
      label: 'C-2 · Contacto 2',
      detail: 'Segunda misión de contacto.',
      kindLabel: 'Serie',
    },
    {
      key: 'mission-3',
      typeCode: 'DM',
      code: 'C-3',
      name: 'Contacto 3',
      label: 'C-3 · Contacto 3',
      detail: 'Tercera misión de contacto.',
      kindLabel: 'Serie',
    },
  ],
  maneuvers: [
    ...subphase.maneuvers,
    {
      id: 'maneuver-3',
      code: 'LAND',
      name: 'Aterrizaje',
      description: 'Aproximación y toma.',
      operationId: 'air',
      operationName: 'Operación en el aire',
    },
  ],
  configuredCells: 1,
  totalCells: 9,
  percentage: 11,
};

describe('ProgramStandardMatrix', () => {
  async function createFixture(
    currentSubphase: ProgramStandardSubphaseView = subphase,
  ): Promise<ComponentFixture<ProgramStandardMatrix>> {
    await TestBed.configureTestingModule({ imports: [ProgramStandardMatrix] }).compileComponents();
    const fixture = TestBed.createComponent(ProgramStandardMatrix);
    fixture.componentRef.setInput('subphase', currentSubphase);
    fixture.componentRef.setInput('assignmentMap', {
      [standardCellKey('mission-1', 'maneuver-1')]: 'B',
    });
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el código del tipo sobre el código de misión y solo el nombre de la maniobra', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;
    const missionHeader = root.querySelector('.psm__mission-head') as HTMLElement;
    const maneuverCells = [...root.querySelectorAll<HTMLElement>('.psm__maneuver-cell')];

    expect(missionHeader.querySelector('.psm__mission-type')?.textContent?.trim()).toBe('DM');
    expect(missionHeader.querySelector('strong')?.textContent?.trim()).toBe('C-1');
    expect(missionHeader.textContent).not.toContain('Contacto 1');
    expect(missionHeader.textContent).not.toContain('Serie');
    expect(missionHeader.textContent).not.toContain('1/2');

    expect(maneuverCells.map((cell) => cell.textContent?.trim())).toEqual([
      'Briefing de la misión',
      'Despegue',
    ]);
    expect(root.textContent).not.toContain('BRF');
    expect(root.textContent).not.toContain('TOFF');
    expect(root.textContent).not.toContain('Preparación previa al vuelo.');
    expect(root.textContent).not.toContain('Despegue y transición inicial.');
    expect(root.querySelector('.psm__group-title')?.textContent?.trim()).toBe('Operación en tierra');
    expect(root.querySelector('.psm__group-row small')).toBeNull();
    expect(root.textContent).not.toContain('1 maniobra');
    expect(root.querySelectorAll('app-dirbe-cell-selector')).toHaveLength(2);
    expect(
      (root.querySelector('app-dirbe-cell-selector button') as HTMLButtonElement).textContent?.trim(),
    ).toBe('B');
  });

  it('adopta el modo ampliado sin duplicar la lógica de la matriz', async () => {
    const fixture = await createFixture();
    fixture.componentRef.setInput('mode', 'expanded');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.psm--expanded')).not.toBeNull();
    expect(root.querySelectorAll('.psm__mission-head')).toHaveLength(1);
  });

  it('emite la misión y maniobra del cuadrante pulsado', async () => {
    const fixture = await createFixture();
    const selected: string[] = [];
    fixture.componentInstance.cellSelected.subscribe((cell) =>
      selected.push(`${cell.mission.key}:${cell.maneuver.id}`),
    );

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'app-dirbe-cell-selector button',
    ) as HTMLButtonElement;
    button.click();

    expect(selected).toEqual(['mission-1:maneuver-1']);
  });

  it('resalta una guía en L solo hasta el cuadrante señalado', async () => {
    const fixture = await createFixture(axisSubphase);
    const root = fixture.nativeElement as HTMLElement;
    const table = root.querySelector('.psm__matrix') as HTMLTableElement;
    const rows = [...root.querySelectorAll<HTMLElement>('.psm__maneuver-row')];
    const groupRows = [...root.querySelectorAll<HTMLElement>('.psm__group-row')];
    const missionHeaders = [...root.querySelectorAll<HTMLElement>('.psm__mission-head')];
    const firstRowCells = [...rows[0].querySelectorAll<HTMLElement>('.psm__level-cell')];
    const secondRowCells = [...rows[1].querySelectorAll<HTMLElement>('.psm__level-cell')];
    const thirdRowCells = [...rows[2].querySelectorAll<HTMLElement>('.psm__level-cell')];

    secondRowCells[1].dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();

    expect(missionHeaders[1].classList.contains('psm__mission-head--axis')).toBe(true);
    expect(missionHeaders[0].classList.contains('psm__mission-head--axis')).toBe(false);
    expect(missionHeaders[2].classList.contains('psm__mission-head--axis')).toBe(false);

    expect(rows[1].querySelector('.psm__number-cell--axis')).not.toBeNull();
    expect(rows[1].querySelector('.psm__maneuver-cell--axis')).not.toBeNull();
    expect(rows[0].querySelector('.psm__number-cell--axis')).toBeNull();

    expect(firstRowCells[1].classList.contains('psm__level-cell--column-axis')).toBe(true);
    expect(firstRowCells[0].classList.contains('psm__level-cell--column-axis')).toBe(false);
    expect(secondRowCells[0].classList.contains('psm__level-cell--row-axis')).toBe(true);
    expect(secondRowCells[1].classList.contains('psm__level-cell--row-axis')).toBe(true);
    expect(secondRowCells[1].classList.contains('psm__level-cell--column-axis')).toBe(true);
    expect(secondRowCells[1].classList.contains('psm__level-cell--target')).toBe(true);
    expect(secondRowCells[2].classList.contains('psm__level-cell--row-axis')).toBe(false);
    expect(thirdRowCells[1].classList.contains('psm__level-cell--column-axis')).toBe(false);

    expect(groupRows[0].classList.contains('psm__group-row--axis')).toBe(true);
    expect(groupRows[1].classList.contains('psm__group-row--axis')).toBe(true);
    expect(
      (root.querySelector('.psm') as HTMLElement).style.getPropertyValue('--psm-axis-translate'),
    ).toBe('100%');

    table.dispatchEvent(new Event('pointerleave'));
    fixture.detectChanges();

    expect(root.querySelector('.psm__mission-head--axis')).toBeNull();
    expect(root.querySelector('.psm__level-cell--target')).toBeNull();
    expect(root.querySelector('.psm__group-row--axis')).toBeNull();
  });
});

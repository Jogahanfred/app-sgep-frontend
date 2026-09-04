import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DirbeLevel } from '@core/domain/entities';
import type {
  ProgramStandardManeuverView,
  ProgramStandardMissionView,
} from '../../shared/models/program-standard-matrix.types';
import { DirbeLevelPicker } from './dirbe-level-picker';

const mission: ProgramStandardMissionView = {
  key: 'mission-local',
  typeCode: 'DM',
  code: 'F-1',
  name: 'Misión local',
  label: 'F-1 · Misión local',
  detail: 'Circuito y zona de trabajo',
  kindLabel: 'Doble mando',
};

const maneuver: ProgramStandardManeuverView = {
  id: 'man-toff',
  code: 'TOFF',
  name: 'Despegue normal',
  description: 'Carrera, rotación y ascenso inicial.',
  operationId: 'op-air',
  operationName: 'Operación en el aire',
};

function stubDialog(): void {
  if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
    };
  }
}

async function createFixture(value: DirbeLevel | null = null): Promise<ComponentFixture<DirbeLevelPicker>> {
  await TestBed.configureTestingModule({ imports: [DirbeLevelPicker] }).compileComponents();
  const fixture = TestBed.createComponent(DirbeLevelPicker);
  fixture.componentRef.setInput('open', true);
  fixture.componentRef.setInput('mission', mission);
  fixture.componentRef.setInput('maneuver', maneuver);
  fixture.componentRef.setInput('value', value);
  fixture.detectChanges();
  return fixture;
}

describe('DirbeLevelPicker', () => {
  beforeEach(() => stubDialog());

  it('presenta los cinco estándares como tarjetas y aplica una sola opción', async () => {
    const fixture = await createFixture();
    const applied: Array<DirbeLevel | null> = [];
    fixture.componentInstance.applied.subscribe((level) => applied.push(level));
    const root = fixture.nativeElement as HTMLElement;

    const cards = Array.from(root.querySelectorAll<HTMLButtonElement>('.dlp__card'));
    expect(cards).toHaveLength(5);
    expect(root.querySelector('select')).toBeNull();
    expect(root.textContent).toContain('F-1 · Misión local');
    expect(root.textContent).toContain('TOFF · Despegue normal');
    expect(root.textContent).toContain('Demostración');
    expect(root.textContent).toContain('Insuficiente');
    expect(root.textContent).toContain('Regular');
    expect(root.textContent).toContain('Bueno');
    expect(root.textContent).toContain('Excelente');

    cards.find((card) => (card.textContent ?? '').includes('Regular'))?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedLevel()).toBe('R');

    const applyButton = Array.from(root.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('Aplicar estándar'),
    );
    applyButton?.click();
    expect(applied).toEqual(['R']);
  });

  it('permite dejar sin asignación un cruce que ya tenía estándar', async () => {
    const fixture = await createFixture('B');
    const applied: Array<DirbeLevel | null> = [];
    fixture.componentInstance.applied.subscribe((level) => applied.push(level));
    const root = fixture.nativeElement as HTMLElement;

    const clearButton = Array.from(root.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('Quitar asignación'),
    );
    clearButton?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedLevel()).toBeNull();
    expect(root.textContent).toContain('Sin asignar');

    const applyButton = Array.from(root.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('Aplicar estándar'),
    );
    applyButton?.click();
    expect(applied).toEqual([null]);
  });
});

import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { DirbeLevel } from '@core/domain/entities';
import { DirbeCellSelector } from '../dirbe-cell-selector/dirbe-cell-selector';
import {
  standardCellKey,
  type ProgramStandardManeuverView,
  type ProgramStandardMissionView,
  type ProgramStandardSubphaseView,
} from '../../shared/models/program-standard-matrix.types';

interface MatrixManeuverRow extends ProgramStandardManeuverView {
  rowNumber: number;
}

interface MatrixManeuverGroup {
  id: string;
  label: string;
  firstRowIndex: number;
  rows: MatrixManeuverRow[];
}

interface MatrixAxisPosition {
  subphaseId: string;
  rowIndex: number;
  columnIndex: number;
}

export interface ProgramStandardMatrixCell {
  mission: ProgramStandardMissionView;
  maneuver: ProgramStandardManeuverView;
}

@Component({
  selector: 'app-program-standard-matrix',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DirbeCellSelector],
  templateUrl: './program-standard-matrix.html',
  styleUrl: './program-standard-matrix.scss',
})
export class ProgramStandardMatrix {
  readonly subphase = input.required<ProgramStandardSubphaseView>();
  readonly assignmentMap = input<Readonly<Record<string, DirbeLevel | null>>>({});
  readonly disabled = input(false);
  readonly mode = input<'embedded' | 'expanded'>('embedded');
  readonly cellSelected = output<ProgramStandardMatrixCell>();

  private readonly activeAxis = signal<MatrixAxisPosition | null>(null);

  readonly activeRowIndex = computed(() => {
    const axis = this.activeAxis();
    return axis?.subphaseId === this.subphase().id ? axis.rowIndex : -1;
  });

  readonly activeColumnIndex = computed(() => {
    const axis = this.activeAxis();
    return axis?.subphaseId === this.subphase().id ? axis.columnIndex : -1;
  });

  readonly activeColumnTranslate = computed(
    () => `${Math.max(this.activeColumnIndex(), 0) * 100}%`,
  );

  readonly maneuverGroups = computed<MatrixManeuverGroup[]>(() => {
    const groups = new Map<string, MatrixManeuverGroup>();
    this.subphase().maneuvers.forEach((maneuver, index) => {
      const groupId = maneuver.operationId || 'other';
      const current = groups.get(groupId) ?? {
        id: groupId,
        label: maneuver.operationName || 'Otras maniobras',
        firstRowIndex: index,
        rows: [],
      };
      current.rows.push({ ...maneuver, rowNumber: index + 1 });
      groups.set(groupId, current);
    });
    return [...groups.values()];
  });

  level(missionKey: string, maneuverId: string): DirbeLevel | null {
    return this.assignmentMap()[standardCellKey(missionKey, maneuverId)] ?? null;
  }

  activateAxis(rowIndex: number, columnIndex: number): void {
    this.activeAxis.set({
      subphaseId: this.subphase().id,
      rowIndex,
      columnIndex,
    });
  }

  clearAxis(): void {
    this.activeAxis.set(null);
  }

  clearAxisWhenFocusLeaves(event: FocusEvent): void {
    const matrix = event.currentTarget as HTMLElement | null;
    const nextTarget = event.relatedTarget;

    if (!matrix || !(nextTarget instanceof Node) || !matrix.contains(nextTarget)) {
      this.clearAxis();
    }
  }

  selectCell(mission: ProgramStandardMissionView, maneuver: ProgramStandardManeuverView): void {
    if (!this.disabled()) {
      this.cellSelected.emit({ mission, maneuver });
    }
  }
}

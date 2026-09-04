import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type { DirbeLevel } from '@core/domain/entities';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { Modal } from '@shared/components/modal/modal';
import { DirbeLevelPicker } from '../dirbe-level-picker/dirbe-level-picker';
import {
  ProgramStandardMatrix,
  type ProgramStandardMatrixCell,
} from '../program-standard-matrix/program-standard-matrix';
import {
  DIRBE_OPTIONS,
  standardCellKey,
  type ProgramStandardDirbeChange,
  type ProgramStandardManeuverView,
  type ProgramStandardMissionView,
  type ProgramStandardSubphaseView,
} from '../../shared/models/program-standard-matrix.types';

interface ActiveDirbeCell {
  mission: ProgramStandardMissionView;
  maneuver: ProgramStandardManeuverView;
  value: DirbeLevel | null;
}

@Component({
  selector: 'app-standard-assignment-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, DirbeLevelPicker, Icon, Modal, ProgramStandardMatrix],
  templateUrl: './standard-assignment-workspace.html',
  styleUrl: './standard-assignment-workspace.scss',
})
export class StandardAssignmentWorkspace {
  readonly phaseLabel = input.required<string>();
  readonly subphase = input.required<ProgramStandardSubphaseView>();
  readonly assignmentMap = input<Readonly<Record<string, DirbeLevel | null>>>({});
  readonly editProgramHref = input.required<string>();
  readonly dirty = input(false);
  readonly saving = input(false);
  readonly levelChange = output<ProgramStandardDirbeChange>();
  readonly saveRequested = output<string>();

  readonly dirbeOptions = DIRBE_OPTIONS;
  readonly activeCell = signal<ActiveDirbeCell | null>(null);
  readonly matrixExpanded = signal(false);

  level(missionKey: string, maneuverId: string): DirbeLevel | null {
    return this.assignmentMap()[standardCellKey(missionKey, maneuverId)] ?? null;
  }

  openExpandedMatrix(): void {
    if (this.subphase().hasMatrix) {
      this.matrixExpanded.set(true);
    }
  }

  closeExpandedMatrix(): void {
    this.matrixExpanded.set(false);
  }

  openLevelPicker(cell: ProgramStandardMatrixCell): void {
    if (this.saving()) return;
    this.activeCell.set({
      ...cell,
      value: this.level(cell.mission.key, cell.maneuver.id),
    });
  }

  closeLevelPicker(): void {
    this.activeCell.set(null);
  }

  applyLevel(level: DirbeLevel | null): void {
    const active = this.activeCell();
    if (!active) return;

    if (this.level(active.mission.key, active.maneuver.id) !== level) {
      this.changeLevel(active.mission.key, active.maneuver.id, level);
    }
    this.closeLevelPicker();
  }

  changeLevel(missionKey: string, maneuverId: string, level: DirbeLevel | null): void {
    this.levelChange.emit({
      subphaseId: this.subphase().id,
      missionKey,
      maneuverId,
      level,
    });
  }
}

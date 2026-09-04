import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import type { DirbeLevel } from '@core/domain/entities';
import { Button } from '@shared/components/button/button';
import { Icon } from '@shared/components/icon/icon';
import { Modal } from '@shared/components/modal/modal';
import { RippleDirective } from '@shared/directives/ripple.directive';
import {
  DIRBE_OPTIONS,
  type ProgramStandardManeuverView,
  type ProgramStandardMissionView,
} from '../../shared/models/program-standard-matrix.types';

@Component({
  selector: 'app-dirbe-level-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, Modal, RippleDirective],
  templateUrl: './dirbe-level-picker.html',
  styleUrl: './dirbe-level-picker.scss',
})
export class DirbeLevelPicker {
  readonly open = input(false);
  readonly mission = input<ProgramStandardMissionView | null>(null);
  readonly maneuver = input<ProgramStandardManeuverView | null>(null);
  readonly value = input<DirbeLevel | null>(null);
  readonly disabled = input(false);

  readonly applied = output<DirbeLevel | null>();
  readonly closed = output<void>();

  readonly options = DIRBE_OPTIONS;
  readonly selectedLevel = signal<DirbeLevel | null>(null);
  readonly selectedOption = computed(
    () => DIRBE_OPTIONS.find((option) => option.value === this.selectedLevel()) ?? null,
  );

  constructor() {
    effect(() => {
      if (this.open()) this.selectedLevel.set(this.value());
    });
  }

  select(level: DirbeLevel): void {
    if (!this.disabled()) this.selectedLevel.set(level);
  }

  clear(): void {
    if (!this.disabled()) this.selectedLevel.set(null);
  }

  cancel(): void {
    this.closed.emit();
  }

  apply(): void {
    if (!this.disabled()) this.applied.emit(this.selectedLevel());
  }
}

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { DirbeLevel } from '@core/domain/entities';
import { DIRBE_OPTIONS } from '../../shared/models/program-standard-matrix.types';

@Component({
  selector: 'app-dirbe-cell-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dirbe-cell-selector.html',
  styleUrl: './dirbe-cell-selector.scss',
})
export class DirbeCellSelector {
  readonly value = input<DirbeLevel | null>(null);
  readonly label = input('Estándar DIRBE');
  readonly disabled = input(false);
  readonly editRequested = output<void>();

  readonly option = computed(() => DIRBE_OPTIONS.find((item) => item.value === this.value()) ?? null);
  readonly ariaLabel = computed(() => {
    const option = this.option();
    return option
      ? `${this.label()}. ${option.value}: ${option.label}. Pulsa para cambiar el estándar.`
      : `${this.label()}. Sin estándar asignado. Pulsa para configurarlo.`;
  });

  requestEdit(): void {
    if (this.disabled()) return;
    this.editRequested.emit();
  }
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { UiProgressScale } from '@shared/types/ui-progress.types';

@Component({
  selector: 'ui-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-progress.html',
  styleUrl: './ui-progress.scss',
})
export class UiProgress {
  readonly value = input(0);
  readonly caption = input('');
  readonly valueLabel = input('');
  readonly label = input('Progreso');
  readonly scale = input<UiProgressScale>('xs');

  readonly clamped = computed(() => Math.min(100, Math.max(0, this.value())));
}

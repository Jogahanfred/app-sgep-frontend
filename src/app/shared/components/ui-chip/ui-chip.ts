import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="chip">
      <span class="chip__label">{{ label() }}</span>
      @if (removable()) {
        <button type="button" class="chip__remove" (click)="removed.emit()">{{ removeLabel() }}</button>
      }
    </span>
  `,
  styleUrl: './ui-chip.scss',
})
export class UiChip {
  readonly label = input.required<string>();
  readonly removable = input(false);
  readonly removeLabel = input('Quitar');
  readonly removed = output<void>();
}

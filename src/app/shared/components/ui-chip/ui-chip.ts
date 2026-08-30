import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (selectable()) {
      <button
        type="button"
        class="chip chip--choice"
        [class.chip--on]="selected()"
        [attr.aria-pressed]="selected()"
        (click)="selectedChange.emit()"
      >
        <span class="chip__label">{{ label() }}</span>
      </button>
    } @else if (removable()) {
      <button
        type="button"
        class="chip chip--flip"
        [attr.aria-label]="'Quitar ' + label()"
        (click)="removed.emit()"
      >
        <span class="chip__inner">
          <span class="chip__face chip__face--front">{{ label() }}</span>
          <span class="chip__face chip__face--back">{{ removeLabel() }}</span>
        </span>
      </button>
    } @else {
      <span class="chip">
        <span class="chip__label">{{ label() }}</span>
      </span>
    }
  `,
  styleUrl: './ui-chip.scss',
})
export class UiChip {
  readonly label = input.required<string>();
  readonly removable = input(false);
  readonly selectable = input(false);
  readonly selected = input(false);
  readonly removeLabel = input('Quitar');
  readonly removed = output<void>();
  readonly selectedChange = output<void>();
}

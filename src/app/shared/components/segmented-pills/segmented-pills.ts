import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ChoiceOption } from '@shared/models/choice.model';

@Component({
  selector: 'app-segmented-pills',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sp" role="radiogroup" [attr.aria-label]="label()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          class="sp__btn"
          role="radio"
          [attr.aria-checked]="value() === option.value"
          [class.sp__btn--on]="value() === option.value"
          (click)="valueChange.emit(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './segmented-pills.scss',
})
export class SegmentedPills {
  readonly label = input.required<string>();
  readonly options = input.required<ChoiceOption[]>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();
}

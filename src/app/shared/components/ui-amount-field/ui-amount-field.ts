import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiStepperInput } from '../ui-stepper-input/ui-stepper-input';
import { UiFieldLabel } from '../ui-field-label/ui-field-label';
import { UiRangeSlider } from '../ui-range-slider/ui-range-slider';

@Component({
  selector: 'ui-amount-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiFieldLabel, UiStepperInput, UiRangeSlider],
  template: `
    <div class="af">
      <ui-field-label [label]="question()" [info]="info()" />
      <div class="af__row" [class.af__row--stack]="layout() === 'stack'">
        <ui-stepper-input
          [id]="id() + '-stepper'"
          [value]="value()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [suffix]="suffix()"
          (valueChange)="valueChange.emit($event)"
        />
        <ui-range-slider
          [id]="id() + '-slider'"
          [value]="value()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [ariaLabel]="question()"
          [minLabel]="minLabel()"
          [maxLabel]="maxLabel()"
          (valueChange)="valueChange.emit($event)"
        />
      </div>
    </div>
  `,
  styles: `
    .af__row {
      display: grid;
      gap: 1rem;
      align-items: center;
    }

    @media (min-width: 768px) {
      .af__row:not(.af__row--stack) {
        grid-template-columns: minmax(16rem, 1fr) minmax(10rem, 1fr);
      }
    }
  `,
})
export class UiAmountField {
  readonly id = input.required<string>();
  readonly question = input.required<string>();
  readonly value = input.required<number>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input(1000);
  readonly suffix = input('€');
  readonly info = input<string | undefined>(undefined);
  readonly layout = input<'split' | 'stack'>('split');
  readonly minLabel = input<string | undefined>(undefined);
  readonly maxLabel = input<string | undefined>(undefined);
  readonly valueChange = output<number>();
}

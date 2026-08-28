import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AmountStepper } from '../amount-stepper/amount-stepper';
import { FieldQuestion } from '../field-question/field-question';
import { RangeSlider } from '../range-slider/range-slider';

@Component({
  selector: 'app-amount-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldQuestion, AmountStepper, RangeSlider],
  template: `
    <div class="af">
      <app-field-question [label]="question()" [info]="info()" />
      <div class="af__row" [class.af__row--stack]="layout() === 'stack'">
        <app-amount-stepper
          [id]="id() + '-stepper'"
          [value]="value()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [suffix]="suffix()"
          (valueChange)="valueChange.emit($event)"
        />
        <app-range-slider
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
export class AmountField {
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

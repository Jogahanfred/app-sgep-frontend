import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ChoiceOption } from '@shared/models/choice.model';
import { UiFieldLabel } from '../ui-field-label/ui-field-label';

@Component({
  selector: 'ui-radio-card-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiFieldLabel],
  templateUrl: './ui-radio-card-group.html',
  styleUrl: './ui-radio-card-group.scss',
})
export class UiRadioCardGroup {
  readonly id = input.required<string>();
  readonly question = input.required<string>();
  readonly options = input.required<ChoiceOption[]>();
  readonly value = input.required<string>();
  readonly layout = input<'vertical' | 'horizontal'>('vertical');
  readonly info = input<string | undefined>(undefined);
  readonly valueChange = output<string>();

  select(option: string): void {
    this.valueChange.emit(option);
  }

  optionId(option: ChoiceOption): string {
    return `${this.id()}-${option.value}`;
  }
}

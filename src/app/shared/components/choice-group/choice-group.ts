import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ChoiceOption } from '@shared/models/choice.model';
import { FieldQuestion } from '../field-question/field-question';

@Component({
  selector: 'app-choice-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldQuestion],
  templateUrl: './choice-group.html',
  styleUrl: './choice-group.scss',
})
export class ChoiceGroup {
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

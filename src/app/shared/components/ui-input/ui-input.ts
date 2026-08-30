import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RippleDirective } from '@shared/directives/ripple.directive';
import { Icon, type IconName } from '../icon/icon';
import { UiError } from '../ui-error/ui-error';
import { UiFieldLabel } from '../ui-field-label/ui-field-label';

@Component({
  selector: 'ui-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Icon, UiError, UiFieldLabel, RippleDirective],
  templateUrl: './ui-input.html',
  styleUrl: './ui-input.scss',
})
export class UiInput {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'tel' | 'number' | 'password' | 'search'>('text');
  readonly field = input.required<FormControl<string> | FormControl<number>>();
  readonly hint = input<string | undefined>(undefined);
  readonly error = input<string | undefined>(undefined);
  readonly info = input<string | undefined>(undefined);
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly step = input<number | undefined>(undefined);
  readonly maxlength = input<number | undefined>(undefined);
  readonly autocomplete = input<string | undefined>(undefined);
  readonly suffix = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly icon = input<IconName | undefined>(undefined);
  readonly appearance = input<'default' | 'amount'>('default');
}

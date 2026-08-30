import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RippleDirective } from '@shared/directives/ripple.directive';
import { Icon, type IconName } from '../icon/icon';
import { UiError } from '../ui-error/ui-error';
import { UiFieldLabel } from '../ui-field-label/ui-field-label';

@Component({
  selector: 'ui-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Icon, UiError, UiFieldLabel, RippleDirective],
  templateUrl: './ui-textarea.html',
  styleUrl: './ui-textarea.scss',
})
export class UiTextarea {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly field = input.required<FormControl<string>>();
  readonly hint = input<string | undefined>(undefined);
  readonly error = input<string | undefined>(undefined);
  readonly info = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly icon = input<IconName | undefined>(undefined);
  readonly rows = input(4);
}

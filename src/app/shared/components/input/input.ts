import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './input.html',
  styleUrl: './input.scss',
})
export class FormInput {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'tel' | 'number' | 'password'>('text');
  readonly field = input.required<FormControl<string> | FormControl<number>>();
  readonly hint = input<string | undefined>(undefined);
  readonly error = input<string | undefined>(undefined);
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly step = input<number | undefined>(undefined);
  readonly autocomplete = input<string | undefined>(undefined);
  readonly suffix = input<string | undefined>(undefined);
}

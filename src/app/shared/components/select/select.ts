import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="field" [class.field--error]="!!error()">
      <label class="field__label" [attr.for]="id()">{{ label() }}</label>
      <select
        class="field__control"
        [id]="id()"
        [formControl]="field()"
        [attr.aria-invalid]="error() ? true : null"
        [attr.aria-describedby]="error() ? id() + '-error' : null"
      >
        @for (option of options(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
      @if (error()) {
        <p class="field__error" [id]="id() + '-error'" role="alert">{{ error() }}</p>
      }
    </div>
  `,
  styleUrl: '../input/input.scss',
})
export class FormSelect {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly field = input.required<FormControl<string>>();
  readonly options = input.required<SelectOption[]>();
  readonly error = input<string | undefined>(undefined);
}

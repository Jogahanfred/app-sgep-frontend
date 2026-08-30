import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RippleDirective } from '@shared/directives/ripple.directive';

@Component({
  selector: 'ui-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RippleDirective],
  template: `
    <label class="ck" [attr.for]="id()" appRipple [appRippleDisabled]="disabled()">
      <input
        class="ck__native"
        type="checkbox"
        [id]="id()"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="onChange($event)"
      />
      <span class="ck__box" aria-hidden="true">
        @if (checked()) {
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3.5 8.2 6.4 11.2 12.5 4.6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        }
      </span>
      <span class="ck__label">{{ label() }}</span>
    </label>
  `,
  styleUrl: './ui-checkbox.scss',
})
export class UiCheckbox {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly checkedChange = output<boolean>();

  onChange(event: Event): void {
    if (this.disabled()) return;
    this.checkedChange.emit((event.target as HTMLInputElement).checked);
  }
}

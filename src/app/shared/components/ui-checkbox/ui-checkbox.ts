import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="ck" [attr.for]="id()">
      <input
        class="ck__native"
        type="checkbox"
        [id]="id()"
        [checked]="checked()"
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
  readonly checkedChange = output<boolean>();

  onChange(event: Event): void {
    this.checkedChange.emit((event.target as HTMLInputElement).checked);
  }
}

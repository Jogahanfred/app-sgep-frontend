import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiInfo } from '../ui-info/ui-info';

@Component({
  selector: 'ui-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiInfo],
  template: `
    <div class="tg">
      <div class="tg__q">
        <p class="tg__label">{{ label() }}</p>
        @if (info()) {
          <ui-info [text]="info()" />
        }
      </div>
      <button
        type="button"
        class="tg__sw"
        role="switch"
        [id]="id()"
        [attr.aria-checked]="checked()"
        [class.tg__sw--on]="checked()"
        (click)="checkedChange.emit(!checked())"
      >
        <span class="tg__thumb"></span>
        <span class="tg__mark" aria-hidden="true">{{ checked() ? '✓' : '×' }}</span>
      </button>
    </div>
  `,
  styleUrl: './ui-toggle.scss',
})
export class UiToggle {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly checked = input(false);
  readonly info = input<string | undefined>(undefined);
  readonly checkedChange = output<boolean>();
}

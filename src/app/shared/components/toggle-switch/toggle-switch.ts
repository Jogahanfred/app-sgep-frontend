import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InfoTip } from '../info-tip/info-tip';

@Component({
  selector: 'app-toggle-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InfoTip],
  template: `
    <div class="tg">
      <div class="tg__q">
        <p class="tg__label">{{ label() }}</p>
        @if (info()) {
          <app-info-tip [text]="info()" />
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
  styleUrl: './toggle-switch.scss',
})
export class ToggleSwitch {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly checked = input(false);
  readonly info = input<string | undefined>(undefined);
  readonly checkedChange = output<boolean>();
}

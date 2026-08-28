import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-info-tip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="tip">
      <button class="tip__btn" type="button" [attr.aria-label]="label()">
        <span class="tip__mark" aria-hidden="true">i</span>
      </button>
      @if (text()) {
        <span class="tip__bubble" role="tooltip">{{ text() }}</span>
      }
    </span>
  `,
  styleUrl: './info-tip.scss',
})
export class InfoTip {
  readonly text = input<string | undefined>(undefined);
  readonly label = input('Más información');
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiInfo } from '../ui-info/ui-info';

@Component({
  selector: 'ui-field-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiInfo],
  template: `
    <div class="q">
      @if (forId()) {
        <label class="q__text" [attr.for]="forId()">{{ label() }}</label>
      } @else {
        <p class="q__text">{{ label() }}</p>
      }
      @if (info()) {
        <ui-info [text]="info()" />
      }
    </div>
  `,
  styles: `
    .q {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-bottom: 0.65rem;
    }

    .q__text {
      margin: 0;
      color: #333;
      font-size: var(--fs-md);
      font-weight: 500;
    }
  `,
})
export class UiFieldLabel {
  readonly label = input.required<string>();
  readonly info = input<string | undefined>(undefined);
  readonly forId = input<string | undefined>(undefined);
}

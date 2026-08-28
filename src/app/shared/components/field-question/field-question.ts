import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InfoTip } from '../info-tip/info-tip';

@Component({
  selector: 'app-field-question',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InfoTip],
  template: `
    <div class="q">
      @if (forId()) {
        <label class="q__text" [attr.for]="forId()">{{ label() }}</label>
      } @else {
        <p class="q__text">{{ label() }}</p>
      }
      @if (info()) {
        <app-info-tip [text]="info()" />
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
export class FieldQuestion {
  readonly label = input.required<string>();
  readonly info = input<string | undefined>(undefined);
  readonly forId = input<string | undefined>(undefined);
}
